#!/usr/bin/env python3
"""Build the offline macOS app with the system Swift/WebKit toolchain."""
import json
import plistlib
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / 'desktop/build'
RELEASE = ROOT / 'release'
# macOS signing uses a temporary system-volume stage; sources and deliverables stay on T7.
SCRATCH = tempfile.TemporaryDirectory(prefix='word-tree-package-')
STAGE = Path(SCRATCH.name) / '单词树.app'
APP = RELEASE / '单词树.app'
def remove_generated_tree(path):
    # exFAT removes AppleDouble companions together with their normal files.
    def onerror(function, name, error):
        if not isinstance(error[1], FileNotFoundError): raise error[1]
    shutil.rmtree(path, onerror=onerror)

def run(*args):
    subprocess.run(list(map(str,args)), cwd=ROOT, check=True)

run('npm', 'run', 'build')
BUILD.mkdir(exist_ok=True)
RELEASE.mkdir(exist_ok=True)
if STAGE.exists(): remove_generated_tree(STAGE)
contents = STAGE / 'Contents'
(contents/'MacOS').mkdir(parents=True)
resources = contents/'Resources'
resources.mkdir()
shutil.copytree(ROOT/'dist', resources/'site', copy_function=shutil.copy, ignore=shutil.ignore_patterns('._*','.DS_Store'))
shutil.copy2(ROOT/'THIRD_PARTY_NOTICES.md', resources/'THIRD_PARTY_NOTICES.md')
shutil.copytree(ROOT/'licenses',resources/'data-licenses',copy_function=shutil.copyfile,ignore=shutil.ignore_patterns('._*','.DS_Store'))
license_root = resources/'dependency-licenses'
for folder in subprocess.check_output(['npm','ls','--omit=dev','--all','--parseable'],cwd=ROOT,text=True).splitlines():
    package = Path(folder)
    if package == ROOT or not package.is_dir(): continue
    for license in package.iterdir():
        if license.is_file() and license.name.lower().startswith(('license','licence','copying','notice')):
            relative = package.relative_to(ROOT/'node_modules')
            target = license_root/relative/license.name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(license,target)
run('swiftc','-swift-version','5','-O','-target','arm64-apple-macosx13.0','-framework','Cocoa','-framework','WebKit','-framework','UniformTypeIdentifiers','-file-prefix-map',f'{ROOT}=WordTree','-debug-prefix-map',f'{ROOT}=WordTree',ROOT/'desktop/main.swift','-o',contents/'MacOS/WordTree')
run('swift',ROOT/'desktop/make-icon.swift',BUILD/'AppIcon.iconset')
run('iconutil','-c','icns',BUILD/'AppIcon.iconset','-o',resources/'AppIcon.icns')
plist = dict(CFBundleName='单词树',CFBundleDisplayName='单词树',CFBundleExecutable='WordTree',
             CFBundleIdentifier='org.wordtree.desktop',CFBundlePackageType='APPL',CFBundleIconFile='AppIcon',
             CFBundleShortVersionString='1.0.0',CFBundleVersion='1',LSMinimumSystemVersion='13.0',
             LSApplicationCategoryType='public.app-category.education',NSPrincipalClass='NSApplication',
             NSHighResolutionCapable=True,CFBundleDevelopmentRegion='zh_CN',CFBundleLocalizations=['zh_CN','en'])
with (contents/'Info.plist').open('wb') as file: plistlib.dump(plist,file)
run('xattr','-cr',STAGE)
run('codesign','--force','--sign','-','--timestamp=none',STAGE)
run('codesign','--verify','--deep','--strict','--verbose=2',STAGE)
if APP.exists():
    previous = RELEASE/'单词树.previous.app'
    if previous.exists(): remove_generated_tree(previous)
    APP.rename(previous)
shutil.copytree(STAGE, APP, copy_function=shutil.copy, ignore=shutil.ignore_patterns('._*','.DS_Store'))
run('codesign','--verify','--deep','--strict','--verbose=2',APP)
SCRATCH.cleanup()
manifest = {'name':'单词树','version':'1.0.0','app':str(APP),'runtime':'macOS system WebKit',
            'architecture':'arm64','minimumSystem':'macOS 13','bundledOffline':True,
            'resourcesBytes':sum(p.stat().st_size for p in (APP/'Contents/Resources').rglob('*') if p.is_file() and not p.name.startswith('._'))}
(RELEASE/'macos-build.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(APP)
