import asyncio
import json
from datetime import datetime
from typing import (
    TYPE_CHECKING,
    Any,
    AsyncGenerator,
    Dict,
    List,
    Literal,
    Optional,
    Tuple,
    Union,
    cast,
)

import aiohttp

import litellm  # noqa: E401
from litellm import get_secret
from litellm._logging import verbose_proxy_logger
from litellm.types.utils import GenericGuardrailAPIInputs

if TYPE_CHECKING:
    from litellm.litellm_core_utils.litellm_logging import Logging as LiteLLMLoggingObj

from litellm._uuid import uuid
from litellm.caching.dual_cache import DualCache
from litellm.exceptions import BlockedPiiEntityError
from litellm.integrations.custom_guardrail import CustomGuardrail
from litellm.proxy._types import UserAPIKeyAuth
from litellm.types.guardrails import (
    GuardrailEventHooks,
    LitellmParams,
    PiiAction,
    PiiEntityType,
    PresidioPerRequestConfig,
)
from litellm.types.proxy.guardrails.guardrail_hooks.presidio import (
    PresidioAnalyzeRequest,
    PresidioAnalyzeResponseItem,
)
from litellm.types.utils import GuardrailStatus
from litellm.types.utils import (
    EmbeddingResponse,
    ImageResponse,
    ModelResponse,
    ModelResponseStream,
    StreamingChoices,
)

class CustomPresidioGuardrail(CustomGuardrail):
    def __init__(
        self,
        mock_testing: bool = False,
        mock_redacted_text: Optional[dict] = None,
        presidio_analyzer_api_base: Optional[str] = None,
        presidio_anonymizer_api_base: Optional[str] = None,
        output_parse_pii: Optional[bool] = False,
        apply_to_output: bool = False,
        presidio_ad_hoc_recognizers: Optional[str] = None,
        logging_only: Optional[bool] = None,
        pii_entities_config: Optional[
            Dict[Union[PiiEntityType, str], PiiAction]
        ] = None,
        presidio_language: Optional[str] = None,
        presidio_score_thresholds: Optional[
            Dict[Union[PiiEntityType, str], float]
        ] = None,
        **kwargs,
    ):
        if logging_only is True:
            self.logging_only = True
            kwargs["event_hook"] = GuardrailEventHooks.logging_only
        super().__init__(**kwargs)
        self.guardrail_provider = "presidio"
        self.pii_tokens: dict = (
            {}
        )  # mapping of PII token to original text - only used with Presidio `replace` operation
        self.mock_redacted_text = mock_redacted_text
        self.output_parse_pii = output_parse_pii or False
        self.apply_to_output = apply_to_output
        self.pii_entities_config: Dict[Union[PiiEntityType, str], PiiAction] = (
            pii_entities_config or {}
        )
        self.presidio_score_thresholds: Dict[Union[PiiEntityType, str], float] = (
            presidio_score_thresholds or {}
        )
        self.presidio_language = presidio_language or "en"
        if mock_testing is True:  # for testing purposes only
            return

        ad_hoc_recognizers = presidio_ad_hoc_recognizers
        if ad_hoc_recognizers is not None:
            try:
                with open(ad_hoc_recognizers, "r") as file:
                    self.ad_hoc_recognizers = json.load(file)
            except FileNotFoundError:
                raise Exception(f"File not found. file_path={ad_hoc_recognizers}")
            except json.JSONDecodeError as e:
                raise Exception(
                    f"Error decoding JSON file: {str(e)}, file_path={ad_hoc_recognizers}"
                )
            except Exception as e:
                raise Exception(
                    f"An error occurred: {str(e)}, file_path={ad_hoc_recognizers}"
                )
        else: 
            self.ad_hoc_recognizers = None
        self.validate_environment(
            # presidio_analyzer_api_base=presidio_analyzer_api_base,
            presidio_anonymizer_api_base=presidio_anonymizer_api_base,
        )
        
    def validate_environment(
        self,
        # presidio_analyzer_api_base: Optional[str] = None,
        presidio_anonymizer_api_base: Optional[str] = None,
    ):
        # self.presidio_analyzer_api_base: Optional[
        #     str
        # ] = presidio_analyzer_api_base or get_secret(
        #     "PRESIDIO_ANALYZER_API_BASE", None
        # )  # type: ignore
        self.presidio_anonymizer_api_base: Optional[
            str
        ] = presidio_anonymizer_api_base or litellm.get_secret(
            "PRESIDIO_ANONYMIZER_API_BASE", None
        )  # type: ignore

        # if self.presidio_analyzer_api_base is None:
        #     raise Exception("Missing `PRESIDIO_ANALYZER_API_BASE` from environment")
        # if not self.presidio_analyzer_api_base.endswith("/"):
        #     self.presidio_analyzer_api_base += "/"
        # if not (
        #     self.presidio_analyzer_api_base.startswith("http://")
        #     or self.presidio_analyzer_api_base.startswith("https://")
        # ):
        #     # add http:// if unset, assume communicating over private network - e.g. render
        #     self.presidio_analyzer_api_base = (
        #         "http://" + self.presidio_analyzer_api_base
        #     )

        if self.presidio_anonymizer_api_base is None:
            raise Exception("Missing `PRESIDIO_ANONYMIZER_API_BASE` from environment")
        if not self.presidio_anonymizer_api_base.endswith("/"):
            self.presidio_anonymizer_api_base += "/"
        if not (
            self.presidio_anonymizer_api_base.startswith("http://")
            or self.presidio_anonymizer_api_base.startswith("https://")
        ):
            # add http:// if unset, assume communicating over private network - e.g. render
            self.presidio_anonymizer_api_base = (
                "http://" + self.presidio_anonymizer_api_base
            )
    
    def get_presidio_settings_from_request_data(
        self, data: dict
    ) -> Optional[PresidioPerRequestConfig]:
        if "metadata" in data:
            _metadata = data.get("metadata", None)
            if _metadata is None:
                return None
            _guardrail_config = _metadata.get("guardrail_config")
            if _guardrail_config:
                _presidio_config = PresidioPerRequestConfig(**_guardrail_config)
                return _presidio_config

        return None

    async def check_pii(
        self,
        text: str,
        output_parse_pii: bool,
        presidio_config: Optional[PresidioPerRequestConfig],
        request_data: dict,
    ) -> str:
        """
        Calls Presidio Analyze + Anonymize endpoints for PII Analysis + Masking
        """
        start_time = datetime.now()
        analyze_results: Optional[Union[List[PresidioAnalyzeResponseItem], Dict]] = None
        status: GuardrailStatus = "success"
        masked_entity_count: Dict[str, int] = {}
        exception_str: str = ""
        try:
            if self.mock_redacted_text is not None:
                redacted_text = self.mock_redacted_text
            else:
                return await self.anonymize_text(
                    text=text,
                    analyze_results=analyze_results,
                    output_parse_pii=output_parse_pii,
                    masked_entity_count=masked_entity_count,
                )
            return redacted_text["text"]
        except Exception as e:
            status = "guardrail_failed_to_respond"
            exception_str = str(e)
            raise e
        finally:
            ####################################################
            # Create Guardrail Trace for logging on Langfuse, Datadog, etc.
            ####################################################
            guardrail_json_response: Union[Exception, str, dict, List[dict]] = {}
            if status == "success":
                if isinstance(analyze_results, List):
                    guardrail_json_response = [dict(item) for item in analyze_results]
            else:
                guardrail_json_response = exception_str
            self.add_standard_logging_guardrail_information_to_request_data(
                guardrail_provider=self.guardrail_provider,
                guardrail_json_response=guardrail_json_response,
                request_data=request_data,
                guardrail_status=status,
                start_time=start_time.timestamp(),
                end_time=datetime.now().timestamp(),
                duration=(datetime.now() - start_time).total_seconds(),
                masked_entity_count=masked_entity_count,
            )

    async def async_pre_call_hook(
        self,
        user_api_key_dict: UserAPIKeyAuth,
        cache: DualCache,
        data: dict,
        call_type: str,
    ):
        """
        - Check if request turned off pii
            - Check if user allowed to turn off pii (key permissions -> 'allow_pii_controls')

        - Take the request data
        - Call /analyze -> get the results
        - Call /anonymize w/ the analyze results -> get the redacted text

        For multiple messages in /chat/completions, we'll need to call them in parallel.
        """

        try:
            content_safety = data.get("content_safety", None)
            verbose_proxy_logger.debug("content_safety: %s", content_safety)
            presidio_config = self.get_presidio_settings_from_request_data(data)
            messages = data.get("messages", None)
            if messages is None:
                return data
            tasks = []
            task_mappings: List[
                Tuple[int, Optional[int]]
            ] = []  # Track (message_index, content_index) for each task

            for msg_idx, m in enumerate(messages):
                content = m.get("content", None)
                if content is None:
                    continue
                if isinstance(content, str):
                    tasks.append(
                        self.check_pii(
                            text=content,
                            output_parse_pii=self.output_parse_pii,
                            presidio_config=presidio_config,
                            request_data=data,
                        )
                    )
                    task_mappings.append(
                        (msg_idx, None)
                    )  # None indicates string content
                elif isinstance(content, list):
                    for content_idx, c in enumerate(content):
                        text_str = c.get("text", None)
                        if text_str is None:
                            continue
                        tasks.append(
                            self.check_pii(
                                text=text_str,
                                output_parse_pii=self.output_parse_pii,
                                presidio_config=presidio_config,
                                request_data=data,
                            )
                        )
                        task_mappings.append((msg_idx, int(content_idx)))

            responses = await asyncio.gather(*tasks)

            # Map responses back to the correct message and content item
            for task_idx, r in enumerate(responses):
                mapping = task_mappings[task_idx]
                msg_idx = cast(int, mapping[0])
                content_idx_optional = cast(Optional[int], mapping[1])
                content = messages[msg_idx].get("content", None)
                if content is None:
                    continue
                if isinstance(content, str) and content_idx_optional is None:
                    messages[msg_idx][
                        "content"
                    ] = r  # replace content with redacted string
                elif isinstance(content, list) and content_idx_optional is not None:
                    messages[msg_idx]["content"][content_idx_optional]["text"] = r

            verbose_proxy_logger.debug(
                f"Presidio PII Masking: Redacted pii message: {data['messages']}"
            )
            data["messages"] = messages
            return data
        except Exception as e:
            raise e
        
    async def anonymize_text(
        self,
        text: str,
        analyze_results: Any,
        output_parse_pii: bool,
        masked_entity_count: Dict[str, int],
    ) -> str:
        """
        Send analysis results to the Presidio anonymizer endpoint to get redacted text
        """
        try:
            # If there are no detections after filtering, return the original text
            if isinstance(analyze_results, list) and len(analyze_results) == 0:
                return text

            async with aiohttp.ClientSession() as session:
                # Make the request to /anonymize
                anonymize_url = f"{self.presidio_anonymizer_api_base}anonymize"
                verbose_proxy_logger.debug("Making request to: %s", anonymize_url)
                anonymize_payload = {
                    "text": text,
                    "analyzer_results": analyze_results,
                }

                async with session.post(
                    anonymize_url, json=anonymize_payload
                ) as response:
                    redacted_text = await response.json()
                new_text = text
                if redacted_text is not None:
                    verbose_proxy_logger.debug("redacted_text: %s", redacted_text)
                    for item in redacted_text["items"]:
                        start = item["start"]
                        end = item["end"]
                        replacement = item["text"]  # replacement token
                        if item["operator"] == "replace" and output_parse_pii is True:
                            # check if token in dict
                            # if exists, add a uuid to the replacement token for swapping back to the original text in llm response output parsing
                            if replacement in self.pii_tokens:
                                replacement = replacement + str(uuid.uuid4())

                            self.pii_tokens[replacement] = new_text[
                                start:end
                            ]  # get text it'll replace

                        new_text = new_text[:start] + replacement + new_text[end:]
                        entity_type = item.get("entity_type", None)
                        if entity_type is not None:
                            masked_entity_count[entity_type] = (
                                masked_entity_count.get(entity_type, 0) + 1
                            )
                    return redacted_text["text"]
                else:
                    raise Exception(f"Invalid anonymizer response: {redacted_text}")
        except Exception as e:
            raise e