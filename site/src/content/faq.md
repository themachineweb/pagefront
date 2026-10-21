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
the first party who can state what a product is, is the one selling it.

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

## Why should I try this now?

Doing a pilot is a small task, but learning how to participate in the
Machine Web is a giant step forward. One product and a few hours give you a
sheet a machine can read, a report of what your shop could not state, and a
view of your own data you have never had. The format is still being written,
so what you find shapes it. And when readers arrive, you are already ahead
of the pack.

## Will this get me cited by ChatGPT?

No one can promise that, and we do not. What a sheet does is remove the two
reasons a machine has for not using your data: it was too expensive to
fetch, and too ambiguous to trust. Whether a given assistant then quotes you
is its decision.

## Am I creating a second catalogue to maintain?

You are porting your catalogue to the Machine Web. For a while the two run
side by side and you keep them in step: when a price or the stock changes,
the sheet changes too, by hand at first, from your shop's own data once it
is wired in. Longer term the sheet can become the foundation, the one
description your site, your partners and the machines all read from.

## Can I do this on Shopify or WooCommerce without a developer?

Writing the sheet and checking it, yes: a chat assistant does the writing
and [Check](/pagefront/commerce/validate) does the checking. Serving the
sheet on your domain and adding the link to your product pages are changes
to your site, and on most platforms that is a job for whoever runs it. If
your pages are rendered by your own application, it is a developer's job.

## How do I know it is working?

Three things, in order. [Check](/pagefront/commerce/validate) passes: the
page declares the sheet, the sheet is where the page says, and it conforms.
The sheet is reachable: fetch it signed out, from outside your admin, and
the search engines you care about have indexed it, which their tools will
show you. A reader used it: today the way to know is to ask one. Give an
assistant your product page and see whether its answer carries what only
the sheet states. What we have observed so far about assistants reaching
sheets is [on the publish page](/pagefront/publish#2-serve-it).

## Does it replace Schema.org, or my product feeds?

Neither. A sheet is Schema.org, extended where commerce needs it, in a file
of its own. Your feeds keep working exactly as before. A sheet is for a
broader audience: every machine that reads the web, not the one destination
a feed was built for.

## What does it cost, and who do I sign up with?

The standard costs nothing, and you sign up with nobody. There is no
account, no registry, no fee and no licence to accept. Serving the sheet and
linking it are work on your site, like any change to it. If this site
disappeared, your sheet would keep working.

## Will the format change under me?

Before release 1.0.0, yes, it can. A breaking change always arrives as a new
release number, never silently, and a sheet says which release it was
written for. From 1.0.0, nothing that has been published changes meaning,
and a removal is announced and stays valid for at least twelve months.

## Can I take a sheet down?

Yes. It is your file on your domain. Remove it and let the address answer
404, and remove the link from the page. Nothing else needs to be told.
Copies already fetched stay with whoever fetched them, as with any page.

## Who decides what goes in the spec?

Today, the founder; [the governance page](/pagefront/governance) says so and
says how that changes. Anyone can open an issue on
[the repository](https://github.com/themachineweb/pagefront), and
[the contributing page](/pagefront/contributing) says how.
