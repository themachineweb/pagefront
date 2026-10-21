# FAQ

## What is Pagefront?

An open specification for a small file, called a sheet, that describes a
product, a collection or the organization behind them in a form machines
read directly. It uses Schema.org's vocabulary, extended where commerce
needs it, is written in JSON, and lives at its own address on your domain,
linked from the page it describes.

## What is it for, and who is it for?

For publishers who want to participate in the Machine Web on their own
terms. Instead of relying on third parties to frame their catalogue,
Pagefront publishers describe it themselves, in their own words, at their
own address, and every machine that reads it reads the same thing. What the
Machine Web knows about them is what they chose to say.

## Why now?

Fewer and fewer of the visitors to product pages are people. Assistants
answer questions about products, comparison engines rank them, and agents
are starting to buy them. The pages they read were never built for them, and
the only party who can state what a product is, reliably, is the one selling
it.

## Why does it matter?

Because the next customer who meets your product may never see your page.
An assistant will describe it, a comparison engine will rank it, an agent
will decide whether to buy it, and all of them will work from a
reconstruction of what you published for people. You will not choose the
channel. You can still choose the description.

## What is the current status?

Early days. The specification is at commerce release 0.5.0 and still moving.
Two merchants work with us as design partners, and their shops are where the
format is being proven. The next publishers shape what 1.0 becomes;
[the contributing page](/pagefront/contributing) says how.

## Will this get me cited by ChatGPT?

No one can promise that, and we do not. What a sheet does is remove the two
reasons a machine has for not using your data: it was too expensive to
fetch, and too ambiguous to trust. Whether a given assistant then quotes you
is its decision.

## Am I creating a second catalogue to maintain?

You are porting your catalogue to the Machine Web. For a while the two run
side by side and you keep them in step: when a price or the stock changes,
the sheet changes too, by hand at first, from your shop's own data once it
is wired in. Longer term the sheet is the foundation, the one description
your site, your partners and the machines all read from.

## Can I do this on Shopify or WooCommerce without a developer?

Writing the sheet and checking it, yes: a chat assistant does the writing
and [Check](/pagefront/commerce/validate) does the checking. Serving the
sheet on your domain and adding the link to your product pages are changes
to your site, and on most platforms that is a job for whoever runs it. If
your pages are rendered by your own application, it is a developer's job.

## Does it replace Schema.org, or my product feeds?

Neither. A sheet is Schema.org, extended where commerce needs it, in a file
of its own. Your feeds keep working exactly as before. A sheet is for a
broader audience: every machine that reads the web, not the one destination
a feed was built for.

## What does it cost, and who do I sign up with?

Nothing, and nobody. There is no account, no registry, no fee and no
licence to accept. You write a file, put it on your own server and link to
it. If this site disappeared, your sheet would keep working.

## Will the format change under me?

Before release 1.0.0, yes, it can. A breaking change always arrives as a new
release number, never silently, and a sheet says which release it was
written for. From 1.0.0, nothing that has been published changes meaning,
and a removal is announced and stays valid for at least twelve months.

## Can I take a sheet down?

Yes. It is your file on your domain. Remove it and let the address answer
404, and remove the link from the page. Nothing else needs to be told.

## Who decides what goes in the spec?

Today, the founder; [the governance page](/pagefront/governance) says so and
says how that changes. Anyone can open an issue on
[the repository](https://github.com/themachineweb/pagefront), and
[the contributing page](/pagefront/contributing) says how.
