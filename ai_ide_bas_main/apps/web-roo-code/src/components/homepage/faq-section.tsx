"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FAQItem {
	question: string
	answer: string
}

const faqs: FAQItem[] = [
	{
		question: "What exactly is AI IDE BAS?",
		answer: "AI IDE BAS is an open-source, AI-powered coding assistant that runs in VS Code. It goes beyond simple autocompletion by reading and writing across multiple files, executing commands, and adapting to your workflow—like having a whole dev team right inside your editor.",
	},
	{
		question: "How does AI IDE BAS differ from Copilot, Cursor, or Windsurf?",
		answer: "Open & Customizable: AI IDE BAS is open-source and allows you to integrate any AI model (OpenAI, Anthropic, local LLMs, etc.). Multi-File Edits: It can read, refactor, and update multiple files at once for more holistic changes. Agentic Abilities: AI IDE BAS can run tests, open a browser, or do deeper tasks than a typical AI autocomplete. Permission-Based: You control and approve any file changes or command executions.",
	},
	{
		question: "Is AI IDE BAS really free?",
		answer: "Yes! AI IDE BAS is completely free and open-source. You'll only pay for the AI model usage if you use a paid API (like OpenAI). If you choose free or self-hosted models, there's no cost at all.",
	},
	{
		question: "Will my code stay private?",
		answer: "Yes. Because AI IDE BAS is an extension in your local VS Code, your code never leaves your machine unless you connect to an external AI API. Even then, you control exactly what is sent to the AI model. You can use tools like .rooignore to exclude sensitive files, and you can also run AI IDE BAS with offline/local models for full privacy.",
	},
	{
		question: "Which AI models does AI IDE BAS support?",
		answer: "AI IDE BAS is model-agnostic. It works with: OpenAI models (GPT-3.5, GPT-4, etc.), Anthropic Claude, Local LLMs (through APIs or special plugins), Any other API that follows AI IDE BAS's Model Context Protocol (MCP).",
	},
	{
		question: "Does AI IDE BAS support my programming language?",
		answer: "Likely yes! AI IDE BAS supports a wide range of languages—Python, Java, C#, JavaScript/TypeScript, Go, Rust, etc. Since it leverages the AI model's understanding, new or lesser-known languages may also work, depending on model support.",
	},
	{
		question: "How do I install and get started?",
		answer: "Install AI IDE BAS from the VS Code Marketplace (or GitHub). Add your AI keys (OpenAI, Anthropic, or other) in the extension settings. Open the AI IDE BAS panel (the rocket icon) in VS Code, and start typing commands in plain English!",
	},
	{
		question: "Can it handle large, enterprise-scale projects?",
		answer: "Absolutely. AI IDE BAS uses efficient strategies (like partial-file analysis, summarization, or user-specified context) to handle large codebases. Enterprises especially appreciate the on-prem or self-hosted model option for compliance and security needs.",
	},
	{
		question: "Is it safe for enterprise use?",
		answer: "Yes. AI IDE BAS was designed with enterprise in mind: Self-host AI models or choose your own provider. Permission gating on file writes and commands. Auditable: The entire code is open-source, so you know exactly how it operates.",
	},
	{
		question: "Can AI IDE BAS run commands and tests automatically?",
		answer: "Yes! One of AI IDE BAS's superpowers is command execution (optional and fully permission-based). It can: Run npm install or any terminal command you grant permission for. Execute your test suites. Open a web browser for integration tests.",
	},
	{
		question: "What if I just want a casual coding 'vibe'?",
		answer: 'AI IDE BAS shines for both serious enterprise development and casual "vibe coding." You can ask it to quickly prototype ideas, refactor on the fly, or provide design suggestions—without a rigid, step-by-step process.',
	},
	{
		question: "Can I contribute to AI IDE BAS?",
		answer: "Yes, please do! AI IDE BAS is open-source on GitHub. Submit issues, suggest features, or open a pull request. There's also an active community on VK and Instagram if you want to share feedback or help others.",
	},
	{
		question: "Where can I learn more or get help?",
		answer: "Check out: Official Documentation for setup and advanced guides. VK & Instagram channels for community support. YouTube tutorials and blog posts from fellow developers showcasing real-world usage.",
	},
]

export function FAQSection() {
	const [openIndex, setOpenIndex] = useState<number | null>(null)

	const toggleFAQ = (index: number) => {
		setOpenIndex(openIndex === index ? null : index)
	}

	return (
		<section id="faq-section" className="border-t border-border py-20">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto mb-24 max-w-3xl text-center">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{
							duration: 0.6,
							ease: [0.21, 0.45, 0.27, 0.9],
						}}>
						<h2 className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
							Frequently Asked Questions
						</h2>
						<p className="mt-6 text-lg text-muted-foreground">
							Everything you need to know about AI IDE BAS and how it can transform your development
							workflow.
						</p>
					</motion.div>
				</div>

				<div className="mx-auto max-w-3xl">
					<div className="space-y-4">
						{faqs.map((faq, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{
									duration: 0.5,
									delay: index * 0.1,
									ease: [0.21, 0.45, 0.27, 0.9],
								}}>
								<div className="group relative rounded-lg border border-border/50 bg-background/30 backdrop-blur-xl transition-all duration-300 hover:border-border">
									<button
										onClick={() => toggleFAQ(index)}
										className="flex w-full items-center justify-between p-6 text-left"
										aria-expanded={openIndex === index}>
										<h3 className="text-lg font-medium text-foreground/90">{faq.question}</h3>
										<ChevronDown
											className={cn(
												"h-5 w-5 text-muted-foreground transition-transform duration-200",
												openIndex === index ? "rotate-180" : "",
											)}
										/>
									</button>
									<div
										className={cn(
											"overflow-hidden transition-all duration-300 ease-in-out",
											openIndex === index ? "max-h-96 pb-6" : "max-h-0",
										)}>
										<div className="px-6 text-muted-foreground">
											<p>{faq.answer}</p>
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</div>
		</section>
	)
}
