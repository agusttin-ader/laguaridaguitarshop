#!/usr/bin/env bash
set -e

EXAMPLE_FILE=".env.local.example"
TARGET_FILE=".env.local"

if [ -f "$TARGET_FILE" ]; then
  echo "$TARGET_FILE already exists. Edit it if you need to change values." && exit 0
fi

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "Example file $EXAMPLE_FILE not found." && exit 1
fi

cp "$EXAMPLE_FILE" "$TARGET_FILE"
echo "Created $TARGET_FILE from $EXAMPLE_FILE."
echo "Please open $TARGET_FILE and replace placeholders with your actual Supabase keys." 
echo "Don't commit $TARGET_FILE to git. Restart dev server after editing: npm run dev"
