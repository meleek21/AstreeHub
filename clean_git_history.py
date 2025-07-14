#!/usr/bin/env python3

import os
import sys
import subprocess

def check_git_filter_repo():
    """Check if git-filter-repo is installed"""
    try:
        # Try using the Python module approach
        subprocess.run(["python", "-m", "git_filter_repo", "--version"], 
                       stdout=subprocess.PIPE, 
                       stderr=subprocess.PIPE, 
                       check=False)
        return True
    except FileNotFoundError:
        return False

def backup_repository():
    """Create a backup of the repository"""
    backup_dir = "../ASTREE_PFE_backup"
    print(f"Creating backup in {os.path.abspath(backup_dir)}")
    if os.path.exists(backup_dir):
        print(f"Backup directory {backup_dir} already exists. Please remove or rename it first.")
        return False
    
    try:
        subprocess.run(["git", "clone", "--mirror", ".", backup_dir], check=True)
        print("Backup created successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to create backup: {e}")
        return False

def clean_sensitive_data():
    """Clean sensitive data from the repository history"""
    # Define patterns to match sensitive data in appsettings.json
    patterns = [
        # Database connection strings
        r'"DefaultConnection"\s*:\s*"[^"]*"',
        r'"MongoConnection"\s*:\s*"[^"]*"',
        
        # Cloudinary credentials
        r'"CloudName"\s*:\s*"[^"]*"',
        r'"ApiKey"\s*:\s*"[^"]*"',
        r'"ApiSecret"\s*:\s*"[^"]*"',
        
        # JWT Secret
        r'"Secret"\s*:\s*"[^"]*"',
        
        # Google credentials
        r'"ClientId"\s*:\s*"[^"]*"',
        r'"ClientSecret"\s*:\s*"[^"]*"',
        
        # API Keys
        r'"ApiKey"\s*:\s*"[^"]*"',
    ]
    
    # Create a file with replacement expressions
    with open("expressions.txt", "w") as f:
        for pattern in patterns:
            # Replace with placeholder values
            f.write(f"regex:{pattern}===>#{{{pattern.split('\"')[1]}}}#\n")
    
    try:
        # Run git filter-repo to clean the history
        print("Cleaning repository history...")
        subprocess.run([
            "python", "-m", "git_filter_repo",
            "--force",
            "--replace-text", "expressions.txt"
        ], check=True)
        
        # Clean up the expressions file
        os.remove("expressions.txt")
        print("Repository history cleaned successfully.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to clean repository history: {e}")
        return False

def main():
    # Check if we're in a git repository
    if not os.path.exists(".git"):
        print("Error: Not in a git repository. Please run this script from the root of your git repository.")
        return 1
    
    # Check if git-filter-repo is installed
    if not check_git_filter_repo():
        print("Error: git-filter-repo is not installed or not in PATH.")
        print("Please install it with: pip install git-filter-repo")
        return 1
    
    print("WARNING: This script will rewrite your git history.")
    print("It will remove sensitive data from the entire history of your repository.")
    print("Make sure you have pushed all your changes and have a backup before proceeding.")
    print("\nThis operation is DESTRUCTIVE and CANNOT be undone!")
    
    confirmation = input("\nDo you want to proceed? (yes/no): ")
    if confirmation.lower() != "yes":
        print("Operation cancelled.")
        return 0
    
    # Create a backup
    if not backup_repository():
        return 1
    
    # Clean sensitive data
    if not clean_sensitive_data():
        return 1
    
    print("\nRepository history has been cleaned.")
    print("\nNext steps:")
    print("1. Verify that the sensitive data has been removed from the history.")
    print("2. Force push the changes to your remote repository with:")
    print("   git push origin --force --all")
    print("3. Force push the tags as well:")
    print("   git push origin --force --tags")
    print("\nIMPORTANT: Inform your collaborators that they need to rebase their work")
    print("or re-clone the repository after your force push.")
    print("\nAlso, remember to invalidate and replace any compromised secrets/API keys!")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())