import * as zlib from "zlib";
import { MihonManga, MihonBackupResult } from "@/types";

/**
 * Parses raw protobuf binary from a decompressed Mihon / Tachiyomi backup
 */
export function parseMihonProtobuf(buffer: Uint8Array): MihonBackupResult {
  let pos = 0;
  const len = buffer.length;

  const readVarint = (): number => {
    let result = 0;
    let shift = 0;
    while (pos < len) {
      const b = buffer[pos++];
      result += (b & 0x7f) * Math.pow(2, shift);
      if ((b & 0x80) === 0) break;
      shift += 7;
    }
    return result;
  };

  const readString = (length: number): string => {
    const slice = buffer.subarray(pos, pos + length);
    pos += length;
    return new TextDecoder().decode(slice);
  };

  const mangas: MihonManga[] = [];
  const sources: Record<string, string> = {};
  const categories: string[] = [];

  const skipField = (wireType: number) => {
    if (wireType === 0) {
      readVarint();
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 2) {
      const bytesLen = Number(readVarint());
      pos += bytesLen;
    } else if (wireType === 5) {
      pos += 4;
    }
  };

  while (pos < len) {
    const tag = Number(readVarint());
    if (tag === 0) break;
    const wireType = tag & 0x07;
    const fieldNum = tag >> 3;

    if (fieldNum === 1 && wireType === 2) {
      // backupManga message
      const msgLen = Number(readVarint());
      const endPos = pos + msgLen;
      const manga: MihonManga = {
        sourceId: "",
        url: "",
        title: "",
        favorite: true,
        totalChapters: 0,
        readChapters: 0,
        chapters: [],
      };

      while (pos < endPos) {
        const mTag = Number(readVarint());
        if (mTag === 0) break;
        const mWire = mTag & 0x07;
        const mField = mTag >> 3;

        if (mField === 1 && mWire === 0) {
          manga.sourceId = readVarint().toString();
        } else if (mField === 2 && mWire === 2) {
          manga.url = readString(Number(readVarint()));
        } else if (mField === 3 && mWire === 2) {
          manga.title = readString(Number(readVarint()));
        } else if (mField === 4 && mWire === 2) {
          manga.artist = readString(Number(readVarint()));
        } else if (mField === 5 && mWire === 2) {
          manga.author = readString(Number(readVarint()));
        } else if (mField === 6 && mWire === 2) {
          manga.description = readString(Number(readVarint()));
        } else if (mField === 9 && mWire === 2) {
          manga.thumbnailUrl = readString(Number(readVarint()));
        } else if (mField === 16 && mWire === 2) {
          // BackupChapter message
          const cLen = Number(readVarint());
          const cEnd = pos + cLen;
          const chapter = {
            name: "",
            url: "",
            read: false,
            chapterNumber: 0,
            lastPageRead: 0,
          };
          while (pos < cEnd) {
            const cTag = Number(readVarint());
            if (cTag === 0) break;
            const cWire = cTag & 0x07;
            const cField = cTag >> 3;
            if (cField === 1 && cWire === 2) {
              chapter.url = readString(Number(readVarint()));
            } else if (cField === 2 && cWire === 2) {
              chapter.name = readString(Number(readVarint()));
            } else if (cField === 4 && cWire === 0) {
              chapter.read = readVarint() !== 0;
            } else if (cField === 6 && cWire === 0) {
              chapter.lastPageRead = Number(readVarint());
            } else if (cField === 9 && cWire === 5) {
              const view = new DataView(buffer.buffer, buffer.byteOffset + pos, 4);
              chapter.chapterNumber = view.getFloat32(0, true);
              pos += 4;
            } else {
              skipField(cWire);
            }
          }
          manga.chapters.push(chapter);
          manga.totalChapters += 1;
          if (chapter.read) {
            manga.readChapters += 1;
            manga.lastReadChapterName = chapter.name;
          }
        } else if (mField === 100 && mWire === 0) {
          manga.favorite = readVarint() !== 0;
        } else {
          skipField(mWire);
        }
      }
      pos = endPos;
      mangas.push(manga);
    } else if (fieldNum === 2 && wireType === 2) {
      // backupCategories message
      const catLen = Number(readVarint());
      const catEnd = pos + catLen;
      let catName = "";
      while (pos < catEnd) {
        const catTag = Number(readVarint());
        if (catTag === 0) break;
        const catWire = catTag & 0x07;
        const catField = catTag >> 3;
        if (catField === 1 && catWire === 2) {
          catName = readString(Number(readVarint()));
        } else {
          skipField(catWire);
        }
      }
      pos = catEnd;
      if (catName) categories.push(catName);
    } else if (fieldNum === 101 && wireType === 2) {
      // backupSources message
      const sLen = Number(readVarint());
      const sEnd = pos + sLen;
      let sName = "";
      let sId = "";
      while (pos < sEnd) {
        const sTag = Number(readVarint());
        if (sTag === 0) break;
        const sWire = sTag & 0x07;
        const sField = sTag >> 3;
        if (sField === 1 && sWire === 2) {
          sName = readString(Number(readVarint()));
        } else if (sField === 2 && sWire === 0) {
          sId = readVarint().toString();
        } else {
          skipField(sWire);
        }
      }
      pos = sEnd;
      if (sId) sources[sId] = sName;
    } else {
      skipField(wireType);
    }
  }

  // Link source names to mangas
  for (const m of mangas) {
    if (sources[m.sourceId]) {
      m.sourceName = sources[m.sourceId];
    }
  }

  const totalChaptersRead = mangas.reduce((acc, m) => acc + m.readChapters, 0);

  return {
    mangas,
    totalMangas: mangas.length,
    totalChaptersRead,
    sources,
    categories,
  };
}

/**
 * Handles decompressing and decoding .tachibk, .proto.gz, or JSON files
 */
export function parseMihonBackupBuffer(rawBuffer: Buffer, fileName: string): MihonBackupResult {
  const isJson = fileName.toLowerCase().endsWith(".json") || (rawBuffer[0] === 0x7b && rawBuffer[1] !== 0x1f);

  if (isJson) {
    const text = rawBuffer.toString("utf-8");
    const json = JSON.parse(text);
    return parseMihonJson(json);
  }

  // Check if GZIP compressed (0x1f 0x8b)
  let decompressed: Buffer;
  if (rawBuffer[0] === 0x1f && rawBuffer[1] === 0x8b) {
    decompressed = zlib.gunzipSync(rawBuffer);
  } else {
    decompressed = rawBuffer;
  }

  return parseMihonProtobuf(new Uint8Array(decompressed));
}

interface RawMihonChapter {
  name?: string;
  url?: string;
  read?: boolean;
  chapterNumber?: number | string;
  lastPageRead?: number | string;
}

interface RawMihonManga {
  source?: number | string;
  sourceName?: string;
  url?: string;
  title?: string;
  artist?: string;
  author?: string;
  description?: string;
  thumbnailUrl?: string;
  cover?: string;
  favorite?: boolean;
  chapters?: RawMihonChapter[];
}

interface RawMihonSource {
  sourceId?: number | string;
  name?: string;
}

interface RawMihonCategory {
  name?: string;
}

interface RawMihonBackupData {
  backupManga?: RawMihonManga[];
  mangas?: RawMihonManga[];
  backupSources?: RawMihonSource[];
  backupCategories?: RawMihonCategory[];
}

/**
 * Parses JSON format exported by Tachiyomi / Mihon Backup Viewer
 */
export function parseMihonJson(data: RawMihonBackupData): MihonBackupResult {
  const mangas: MihonManga[] = [];
  const rawList = data.backupManga || data.mangas || [];
  const sources: Record<string, string> = {};

  if (Array.isArray(data.backupSources)) {
    for (const s of data.backupSources) {
      if (s.sourceId) sources[String(s.sourceId)] = s.name || "";
    }
  }

  for (const item of rawList) {
    const chapters = Array.isArray(item.chapters)
      ? item.chapters.map((c: RawMihonChapter) => ({
          name: c.name || "",
          url: c.url || "",
          read: Boolean(c.read),
          chapterNumber: Number(c.chapterNumber || 0),
          lastPageRead: Number(c.lastPageRead || 0),
        }))
      : [];

    const readChapters = chapters.filter((c: { read: boolean }) => c.read).length;
    const lastRead = chapters.find((c: { read: boolean }) => c.read);

    mangas.push({
      sourceId: String(item.source || ""),
      sourceName: sources[String(item.source)] || item.sourceName || undefined,
      url: item.url || "",
      title: item.title || "Sin título",
      artist: item.artist,
      author: item.author,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl || item.cover,
      favorite: item.favorite !== false,
      totalChapters: chapters.length,
      readChapters,
      lastReadChapterName: lastRead?.name,
      chapters,
    });
  }

  const totalChaptersRead = mangas.reduce((acc, m) => acc + m.readChapters, 0);

  return {
    mangas,
    totalMangas: mangas.length,
    totalChaptersRead,
    sources,
    categories: Array.isArray(data.backupCategories)
      ? data.backupCategories.map((c: RawMihonCategory) => c.name || "")
      : [],
  };
}
