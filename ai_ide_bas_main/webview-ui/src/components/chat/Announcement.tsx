import { useState, memo } from "react"
import { Trans } from "react-i18next"
import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"

import { Package } from "@roo/package"

import { useAppTranslation } from "@src/i18n/TranslationContext"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@src/components/ui"

interface AnnouncementProps {
	hideAnnouncement: () => void
}

/**
 * You must update the `latestAnnouncementId` in ClineProvider for new
 * announcements to show to users. This new id will be compared with what's in
 * state for the 'last announcement shown', and if it's different then the
 * announcement will render. As soon as an announcement is shown, the id will be
 * updated in state. This ensures that announcements are not shown more than
 * once, even if the user doesn't close it themselves.
 */

const Announcement = ({ hideAnnouncement }: AnnouncementProps) => {
	const { t } = useAppTranslation()
	const [open, setOpen] = useState(true)

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				setOpen(open)

				if (!open) {
					hideAnnouncement()
				}
			}}>
			<DialogContent className="max-w-96">
				<DialogHeader>
					<DialogTitle>{t("chat:announcement.title", { version: Package.version })}</DialogTitle>
					<DialogDescription>
						{t("chat:announcement.description", { version: Package.version })}
					</DialogDescription>
				</DialogHeader>
				<div>
					<h3>{t("chat:announcement.whatsNew")}</h3>
					<ul className="space-y-2">
						<li>
							•{" "}
							<Trans
								i18nKey="chat:announcement.feature1"
								components={{
									bold: <b />,
									code: <code />,
									guideLink: <GuideLink />,
									settingsLink: (
										<VSCodeLink
											href="#"
											onClick={(e) => {
												e.preventDefault()
												setOpen(false)
												hideAnnouncement()
												window.postMessage(
													{
														type: "action",
														action: "settingsButtonClicked",
														values: { section: "codebaseIndexing" },
													},
													"*",
												)
											}}
										/>
									),
								}}
							/>
						</li>
						<li>
							•{" "}
							<Trans
								i18nKey="chat:announcement.feature2"
								components={{
									bold: <b />,
									code: <code />,
								}}
							/>
						</li>
						<li>
							•{" "}
							<Trans
								i18nKey="chat:announcement.feature3"
								components={{
									bold: <b />,
									code: <code />,
								}}
							/>
						</li>
						<li>
							•{" "}
							<Trans
								i18nKey="chat:announcement.feature4"
								components={{
									bold: <b />,
									code: <code />,
								}}
							/>
						</li>
					</ul>
				</div>
			</DialogContent>
		</Dialog>
	)
}

const GUIDE_URL = "https://t.me/+O9j8UaeSCChjNjli"

const GuideLink = ({ children }: { children?: React.ReactNode }) => (
	<VSCodeLink
		href={GUIDE_URL}
		onClick={(e) => {
			e.preventDefault()
			window.postMessage(
				{ type: "action", action: "openExternal", data: { url: GUIDE_URL } },
				"*",
			)
		}}>
		{children}
	</VSCodeLink>
)

export default memo(Announcement)
