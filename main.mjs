#!/bin/node

import p from 'child_process'
import fs from 'fs'

if (process.argv.length < 3) {
  console.log("./main.mjs filename [ --dryrun ]")
  process.exit(0)
}

let dryrun = process.argv.slice(2).includes('--dryrun')

let filename = process.argv[2]

let [suffix] = filename.split(".").slice(-1)
if (!suffix || suffix == filename) {
  console.log("no suffix")
  process.exit(127)
}

p.exec(`ffprobe -v error -show_format -print_format json "${filename}"`, (err, stdout, stderr) => {
  if (err) {
    console.log(err)
    process.exit(127)
  }
  if (stderr) {
    console.log(stderr)
    process.exit(127)
  }
  if (stdout) {
    let { format: { tags } } = JSON.parse(stdout)
    let artist, title
    if (!tags) {
      console.log('no metadata')
      process.exit(127)
    }
    artist = Object.hasOwn(tags, "artist") ? tags["artist"] :
      Object.hasOwn(tags, "ARTIST") ? tags["ARTIST"] : null

    title = Object.hasOwn(tags, "title") ? tags["title"] :
      Object.hasOwn(tags, "TITLE") ? tags["TITLE"] : null

    let newFilename = `${artist} - ${title}.${suffix}`
    if (dryrun) {
      console.log('new filename: ', newFilename)
      return
    }
    if (newFilename == filename) {
      return
    }
    fs.renameSync(`${filename}`, `${newFilename}`)
  }
})
