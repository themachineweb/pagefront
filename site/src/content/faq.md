# FAQ

## Who reads sheets today?

As of 2026-10-20, nobody that we know of. No merchant serves a sheet from
their own domain yet, and no assistant, search engine or shopping agent has
said it looks for them.

What exists: the specification at commerce release 0.5.0, the lint packages
on npm, [Check](/pagefront/commerce/validate), and three worked examples on
this site, built from real product pages. One merchant,
[Nitto](/pagefront/commerce/case-studies/nitto), has approved publication of
its sheet.

This answer is dated and gets updated at each release.

## Will this get me cited by ChatGPT?

No one can promise that, and we do not. What a sheet does is remove the two
reasons a machine has for not using your data: it was too expensive to
fetch, and too ambiguous to trust. Whether a given assistant then quotes you
is its decision.

## Am I creating a second catalogue to maintain?

For a first product, yes. The sheet is a copy of what your shop already
says, and when a price or the stock changes you run the prompt again. That
is fine for a pilot and tiresome for a catalogue.

The arrangement that lasts generates the sheet from your shop's own data,
so it changes when your shop does. That is the developer version, which is
coming.

## Can I do this on Shopify or WooCommerce without a developer?

Writing the sheet and checking it, yes: a chat assistant does the writing
and [Check](/pagefront/commerce/validate) does the checking. Serving the
sheet on your domain and adding the link to your product pages are changes
to your site, and on most platforms that is a job for whoever runs it. If
your pages are rendered by your own application, it is a developer's job.

## Does it replace Schema.org, or my product feeds?

Neither. A sheet is Schema.org, extended where commerce needs it, in a file
of its own. Your feeds keep working exactly as before; a sheet is something
you add, not something you swap.

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
