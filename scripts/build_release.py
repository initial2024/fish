#!/usr/bin/env python3
"""Reproducible Fish derivative of verified npm dsh-app-pet@1.0.3.

DO NOT copy upstream media without attribution: see THIRD_PARTY_NOTICES.md.
This patches Node plugin files only, NOT the DSH Android APK.
"""
import argparse
import copy
import hashlib
import json
import tarfile
from pathlib import Path

UPSTREAM_SHA="ef30c57434ce8066db8df98f46c8a5ac39141d31cdd82a19ee2705f11b1f8abd"
NEW_NAME="dsh-app-pet-fish"
NEW_VERSION="1.1.0"

def sub(source, old, new, label):
    if source.count(old) != 1:
        raise RuntimeError("PATCH_ANCHOR_CHANGED:"+label+":"+str(source.count(old)))
    return source.replace(old,new,1)

def extract_pinned(archive, output):
    actual=hashlib.sha256(archive.read_bytes()).hexdigest()
    if actual!=UPSTREAM_SHA: raise RuntimeError("PINNED_UPSTREAM_HASH_MISMATCH:"+actual)
    if output.exists(): raise RuntimeError("OUTPUT_ALREADY_EXISTS")
    output.mkdir(parents=True)
    with tarfile.open(archive,"r:gz") as stream:
        seen=set()
        for member in stream:
            p=Path(member.name)
            if (p.is_absolute() or not p.parts or p.parts[0]!="package" or
                ".." in p.parts or member.name in seen):
                raise RuntimeError("UNSAFE_UPSTREAM_ARCHIVE_ENTRY:"+member.name)
            if member.isdir():
                continue
            if (not member.isfile() or len(p.parts)<2):
                raise RuntimeError("UNSAFE_UPSTREAM_ARCHIVE_ENTRY:"+member.name)
            seen.add(member.name)
            dest=output.joinpath(*p.parts[1:])
            dest.parent.mkdir(parents=True,exist_ok=True)
            source=stream.extractfile(member)
            if source is None: raise RuntimeError("BAD_UPSTREAM_ARCHIVE_FILE")
            dest.write_bytes(source.read())

def transform(js):
    banner="""/**
 * Fish v1.1.0 is a noncommercial derivative of dsh-app-pet 1.0.3 (MIT
 * software); 24 original animation clips are by PC2005-cloud/dsh-pet,
 * Copyright (c) 2026 PC2005-cloud, with NONCOMMERCIAL asset/character
 * terms. Copyright/attribution: THIRD_PARTY_NOTICES.md.
 * Fish fixes unsafe file paths, rejects unknown tool actions, adds an
 * offline verify action and optional low-distraction focus preset.
 * It does not modify the Android bubble native implementation.
 */
"""
    js=banner+js
    js=sub(js,"export const name = 'dsh-app-pet';",
           "export const name = 'dsh-app-pet-fish';","plugin_identity")
    js=sub(js,"name: 'deskpet',","name: 'fish_pet',","tool_identity")
    js=sub(js,"enum: ['apply', 'status', 'list'],",
           "enum: ['apply', 'status', 'list', 'verify'],","tool_enum")
    js=sub(js,"const STATE_FILE = path.join('deskpet', 'state.json');",
           "const STATE_FILE = path.join('deskpet', 'fish-state.json');","independent_stamp")
    js=sub(js,"function loadPreset(file) {\n\tconst target",
           """function loadPreset(file) {
  // Model args are untrusted: refuse path traversal outside bundled presets.
  if (typeof file !== 'string' || !/^[a-z][a-z0-9_-]{0,63}[.]json$/.test(file)) {
    return {ok:false,error:'不安全的预设名称'};
  }
\tconst target""","preset_traversal")
    js=sub(js,"""const assetDir = path.join(PKG_ROOT, typeof preset.assets === 'string' && preset.assets !== ''
\t\t? preset.assets
\t\t: 'assets/webm');""",
        """// Preserve package-contained assets only; arbitrary paths are forbidden.
    if (preset.assets !== undefined && preset.assets !== 'assets/webm') {
      return {ok:false,error:'素材目录仅允许 assets/webm'};
    }
    const assetDir = path.join(PKG_ROOT, 'assets/webm');""","asset_dir")
    js=sub(js,"const assetName = String(actions[actionName]);",
           """const assetName = String(actions[actionName]);
        if (!/^[a-z][a-z0-9-]{0,63}$/.test(actionName) ||
            !/^[a-z][a-z0-9-]{0,63}$/.test(assetName)) {
          return {ok:false,error:'动作文件名包含非法字符'};
        }""","asset_names")
    js=sub(js,"/**\n * 启动时下发一次（带重试）。",
           """/**
 * Serialize ONLY this fork's automatic/manual mailbox writes. The separate
 * bubble tool uses the same files; we cannot provide cross-plugin locking.
 */
let fishTail=Promise.resolve();
function applySerialized(home,preset) {
  const result=fishTail.then(()=>applyPreset(home,preset));
  fishTail=result.catch(()=>{});
  return result;
}
/**
 * 启动时下发一次（带重试）。""","serialize")
    js=sub(js,"const result = await applyPreset(home, preset);",
           "const result = await applySerialized(home, preset);","boot_serialized")
    js=sub(js,"const result = await applyPreset(home, loaded.preset);",
           "const result = await applySerialized(home, loaded.preset);","manual_serialized")
    js=sub(js,"""\t\tasync execute(args) {
\t\t\tconst action = args.action;""",
        """\t\tasync execute(args) {
            // Before Fish, unknown action fell through to apply: a write.
            if (!args || !['apply','status','list','verify'].includes(args.action)) {
              return {ok:false,message:'未知操作已拒绝；未修改配置'};
            }
\t\t\tconst action = args.action;
            if (action === 'verify') {
              // Dry run, no bubble mailbox access or native screenshot.
              const loaded=loadPreset(DEFAULT_PRESET);
              if(!loaded.ok)return {ok:false,message:loaded.error};
              const built=buildFields(loaded.preset);
              if(!built.ok)return {ok:false,message:built.error};
              return {ok:true,message:'本地资源检查通过：'+built.note+
                '。原生悬浮球渲染尚未在此检查中验收。'};
            }""","deny_unknown_and_verify")
    js=sub(js,"if (applied === print) {",
           """if (process.env.DSH_PET_FISH_DISABLE_BOOT === '1') {
      log('Fish 自动下发已关闭，使用 fish_pet apply 手动启用');
    } else if (applied === print) {""","boot_optout")
    js=js.replace("deskpet 工具","fish_pet 工具")
    return js

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--source",type=Path,required=True)
    ap.add_argument("--output",type=Path,required=True)
    args=ap.parse_args()
    extract_pinned(args.source,args.output)
    base=args.output
    manifest=json.loads((base/"package.json").read_text())
    if (manifest.get("name"),manifest.get("version"))!=("dsh-app-pet","1.0.3"):
        raise RuntimeError("UNEXPECTED_UPSTREAM_IDENTITY")
    clips=sorted((base/"assets/webm").glob("*.webm"))
    if len(clips)!=24:raise RuntimeError("UPSTREAM_ASSET_COUNT_CHANGED")
    preset=json.loads((base/"presets/pet.json").read_text())
    if len(preset.get("actions",{}))!=24 or len(preset.get("actionMap",{}))!=7:
        raise RuntimeError("UPSTREAM_PRESET_CONTENT_CHANGED")
    manifest["name"]=NEW_NAME
    manifest["version"]=NEW_VERSION
    manifest["description"]="Unofficial noncommercial Android DSH pet fork with safer presets and a focus mode"
    manifest["files"]=list(dict.fromkeys(manifest["files"]+
        ["THIRD_PARTY_NOTICES.md","FISH_CHANGELOG.md"]))
    (base/"package.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
    source_file=base/"lib/index.js"
    source_file.write_text(transform(source_file.read_text()))
    patch_file=base/"cordis.patch.yml"
    patch=patch_file.read_text()
    if "dsh-app-pet" not in patch:raise RuntimeError("CORDIS_PATCH_ID_NOT_FOUND")
    patch_file.write_text(patch.replace("dsh-app-pet",NEW_NAME))
    focus=copy.deepcopy(preset)
    focus["name"]="Fish Focus (低干扰)"
    focus["description"]="保留所有动作和七种工作状态，禁止漫游，缩小桌宠尺寸"
    focus["move"]["enabled"]=False
    focus["move"]["intervalSec"]=120
    focus["appearance"]["size"]=140
    focus["appearance"]["throwEnabled"]=False
    focus["statusAutoHideMs"]=2500
    (base/"presets/focus.json").write_text(
        json.dumps(focus,ensure_ascii=False,indent=2)+"\n")
    notices=Path(__file__).resolve().parents[1]/"THIRD_PARTY_NOTICES.md"
    (base/"THIRD_PARTY_NOTICES.md").write_bytes(notices.read_bytes())
    (base/"FISH_CHANGELOG.md").write_text(
        "Fish v1.1.0 fork of dsh-app-pet@1.0.3: separate package/tool, strict "
        "preset/media name limits, unknown-action rejection, verify dry-run, "
        "serialized own mailbox calls, independent state marker, optional "
        "boot disable and focus mode. Native Android code unchanged.\n")
    print("SOURCE_SHA256_VERIFIED=YES")
    print("24_ORIGINAL_WEBM_UNMODIFIED=YES")
    print("7_STATES_PRESERVED=YES")
    print("NATIVE_PHONE_E2E=NOT_TESTED")
if __name__=="__main__":main()
