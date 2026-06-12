#!/bin/bash
echo "Hello from GitHub + Jenkins on EC2!"
echo "Running awesome-lint..."
npm install
npx awesome-lint
