#!/usr/bin/env python3
"""
StrideSense - Public Datasets Downloader
Downloads sample data from public gait and activity recognition repositories.
"""

import os
import sys
import argparse
import urllib.request
import zipfile
import shutil

DATASETS_DIR = os.path.dirname(os.path.abspath(__file__))

SOURCES = {
    "physionet-gait": {
        "description": "PhysioNet Gait in Parkinson's Disease (Sample record GaPt03_01)",
        "url": "https://physionet.org/files/gaitpdb/1.0.0/GaPt03_01.txt",
        "filename": "physionet_GaPt03_01.txt",
        "type": "direct"
    },
    "uci-har-sample": {
        "description": "UCI HAR Smartphone Dataset (Mini sample for format verification)",
        "url": "https://archive.ics.uci.edu/static/public/240/human+activity+recognition+using+smartphones.zip",
        "filename": "uci_har.zip",
        "type": "zip"
    }
}

def download_file(url: str, destination: str):
    print(f"Downloading from {url}...")
    headers = {"User-Agent": "StrideSense-Research/1.0"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response, open(destination, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
        print(f" Saved to {destination} ({os.path.getsize(destination)} bytes)")
        return True
    except Exception as e:
        print(f" Download error: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="StrideSense Public Dataset Downloader")
    parser.add_argument("--dataset", choices=["physionet-gait", "uci-har-sample", "all"], default="physionet-gait",
                        help="Select dataset to download")
    args = parser.parse_args()

    targets = list(SOURCES.keys()) if args.dataset == "all" else [args.dataset]

    for key in targets:
        meta = SOURCES[key]
        print(f"\n--- Fetching: {meta['description']} ---")
        dest_path = os.path.join(DATASETS_DIR, meta["filename"])
        success = download_file(meta["url"], dest_path)
        if success and meta["type"] == "zip":
            extract_dir = os.path.join(DATASETS_DIR, key)
            print(f"Extracting {dest_path} to {extract_dir}...")
            try:
                with zipfile.ZipFile(dest_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_dir)
                print(" Extraction completed successfully.")
            except Exception as ex:
                print(f" Extraction failed: {ex}")

    print("\nDataset downloader completed.")

if __name__ == "__main__":
    main()
