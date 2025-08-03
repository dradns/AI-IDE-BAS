import { useState } from "react"
import { useAppTranslation } from "@src/i18n/TranslationContext"
import { YouTubeLink } from "../common/YouTubeVideo"
import { InstructionsLink } from "../common/InstructionsLink"

const RooHero = () => {
	const { t } = useAppTranslation()
	const [imagesBaseUri] = useState(() => {
		const w = window as any
		return w.IMAGES_BASE_URI || ""
	})

	return (
		<div className="flex flex-col items-center justify-center pb-4 forced-color-adjust-none">
			<div
				style={{
					backgroundColor: "var(--vscode-foreground)",
					WebkitMaskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
					WebkitMaskRepeat: "no-repeat",
					WebkitMaskSize: "contain",
					maskImage: `url('${imagesBaseUri}/roo-logo.svg')`,
					maskRepeat: "no-repeat",
					maskSize: "contain",
				}}
				className="mx-auto">
				<img src={imagesBaseUri + "/roo-logo.svg"} alt="AI IDE BAS logo" className="h-8 opacity-0" />
			</div>

			<YouTubeLink
				videoUrl="https://youtu.be/GxRvJ0pV6-Q?si=t9EL6bSa3lVM6ZWQ"
				title={t("welcome:buttons.aiIdeBasVideo")}
				className="mb-3"
			/>

			<InstructionsLink
				instructionsUrl="https://telegra.ph/Instrukciya-po-ustanovke-i-nastrojke-AI-IDE-BAS-07-30"
				title={t("welcome:buttons.setupInstructions")}
				className="mb-3"
			/>
		</div>
	)
}

export default RooHero
