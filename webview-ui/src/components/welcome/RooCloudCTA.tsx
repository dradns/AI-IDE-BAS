import { useTranslation } from "react-i18next"

export function RooCloudCTA() {
	const { t } = useTranslation("chat")

	return (
		<div className="border border-muted/20 px-4 py-1 text-center flex items-start gap-2">
			<i className="mr-1 codicon codicon-cloud text-xl! mt-2 text-vscode-descriptionForeground" />
			<div className="text-left">
				<p>
					<strong>{t("rooCloudCTA.title")}</strong>
				</p>
			</div>
		</div>
	)
}

export default RooCloudCTA
