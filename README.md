A knowledge-base app with very (very) basic user authentication (literally plaintext so DO NOT put any actual passwords here)

Requires nodejs

How to use:
Clone this repo and run `npm install`. A SQLite database named `knowledge.db` will be created automatically on first run with a default root user (root:root).

On startup the application will convert any stored article tags to lowercase so
that tag matching is case-insensitive.
