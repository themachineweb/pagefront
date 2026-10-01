# A Sheet for the Machine Web

Your website is a window into your business. For most of the web's history, only people looked through it. That's no longer true.

Search crawlers read your pages. So do price comparators, accessibility tools, mobile browsers on bad connections, and AI agents shopping on behalf of someone who'll never see the page themselves. They all do the same awkward thing: download two to five megabytes of HTML, CSS, JavaScript and fonts to extract a few kilobytes of facts. They mostly get it right. Sometimes they don't. You pay the bandwidth either way, and you don't get to see what they decided you said.

This is fixable. Publish a small companion file next to each page — a sheet — with the same content in a form built for machines. A few KB of typed data. Linked from the page. Served on your domain. Versioned and signed by you.

That's it. That's the idea.

The sheet doesn't replace your site. The site stays exactly as it is. The sheet just gives the non-human readers their own way in, so they stop guessing.

**For merchants**, this means you control what agents see. You decide what's in the sheet, and you can update it without touching your theme. You're not locked into any single gatekeeper — the platforms aggregating your catalog, the networks routing your traffic, or the providers whose agents read on your behalf. One file feeds all of them.

**For agent builders**, the math is straightforward. We measured one merchant: 760× less data to parse, 30× lower latency, no JavaScript to execute, no selectors to maintain. Determinism instead of inference. The cost case writes itself once you're paying for inference at scale.

**For the ecosystem**, it's a cleaner separation between how things look and what they mean. The presentation layer can keep doing what it does. A second layer emerges underneath it — the **Machine Web**: a network of small, typed, machine-built files served by their publishers, read by the agents and crawlers and price comparators who already need them. The Machine Web becomes something publishers own and ship deliberately, instead of something extracted from them by whoever has the best scraper.

**For the planet**, this is bytes that don't get shipped, packets that don't get routed, energy that doesn't get spent rendering pages nobody's going to look at. The economic case and the environmental case are the same fix.

We're starting with product pages because that's where the cost of getting it wrong is most visible. The plan:

1. **The spec.** An open standard, built on Schema.org with a small envelope for provenance and completeness. Discovery via standard HTTP linking (RFC 9727). Drafted now, public soon.
2. **The validator.** Paste a URL, get a score, see what's missing. Free, public, runnable locally.
3. **The registry.** A list of compliant sites — the start of a public index of the Machine Web, so the network effect has somewhere to land.

The standard is open. A hosted SaaS will exist for merchants who want compliance without running infrastructure, but you can implement the spec yourself and never touch us. That's the point.

If you publish on the web, or you build agents that read it, get in touch. The first window served the human web well. Time to open one for the Machine Web.
