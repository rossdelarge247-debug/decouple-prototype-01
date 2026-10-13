# Incoming

A quarantine for files exported from Claude Design, and nothing more.

1. Upload here as exported. Unzip first, keep every file under 100 MB, and never
   include secrets or `.env` files: Gitleaks scans every push to this repository.
2. Nothing imports from this folder and nothing deploys from it.
3. Each file is read, ported into the real structure at the root, then deleted here.
   The folder is empty again when the port is done.

To upload: open this folder on GitHub, choose Add file, then Upload files (up to 100
files a batch, 25 MB each), or push with git.
