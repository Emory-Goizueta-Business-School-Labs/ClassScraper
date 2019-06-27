# ClassScraper
Takes a list of URLs and a classname, gets the text inside elements with that classname at each URL, returns a CSV with the mapping.

# Installation
Clone the repository. Run `npm install`.

# Usage
Basic usage is
```
npm run scraper -- --input=path/to/input.csv --classname=the-class-to-get-text-from --output=path/to/output.csv
```

Optionally add `--verbose` flag to get additional program output in the console.
