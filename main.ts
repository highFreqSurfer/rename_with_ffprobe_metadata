#!/bin/gjs --module

import System from "system"

const Gio = imports.gi.Gio
const GLib = imports.gi.GLib

if (ARGV.length < 1) {
  console.log("./main.mjs filename [ --dryrun ]")
  System.exit(0)
}

let dryrun = ARGV.slice(1).includes('--dryrun')

let filename = ARGV[0]

let [suffix] = filename.split(".").slice(-1)
if (!suffix || suffix == filename) {
  console.log("no suffix")
  System.exit(127)
}

const [, stdout, stderr] = GLib.spawn_command_line_sync(`ffprobe -v error -show_format -print_format json "${filename}"`)

if (stderr &&stderr.length > 0) {
  console.log(new TextDecoder().decode(stderr))
  System.exit(127)
}


if (stdout) {
  let { format: { tags } } = JSON.parse(new TextDecoder().decode(stdout))
  let artist, title
  if (!tags) {
    console.log('no metadata')
    System.exit(127)
  }
  artist = Object.hasOwn(tags, "artist") ? tags["artist"] :
    Object.hasOwn(tags, "ARTIST") ? tags["ARTIST"] : null

  title = Object.hasOwn(tags, "title") ? tags["title"] :
    Object.hasOwn(tags, "TITLE") ? tags["TITLE"] :
      Object.hasOwn(tags, "album") ? tags["album"] :
        Object.hasOwn(tags, "ALBUM") ? tags["ALBUM"] : null

  let newFilename = `${artist} - ${title}.${suffix}`
  if (dryrun) {
    console.log('new filename: ', newFilename)
    System.exit(0)
  }
  if (newFilename == filename) {
    System.exit(0)
  }
  const src = Gio.file_new_for_path(`${filename}`)
  const dst = Gio.file_new_for_path(`${newFilename}`)
  const ok = src.move(dst, Gio.FileCopyFlags.OVERWRITE,null,null)
  if(!ok) {
    console.log("rename failed")
  }
}

