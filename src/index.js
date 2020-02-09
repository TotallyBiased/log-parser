import './env.js'
import { Readable } from "stream"
import * as fs from "fs"

const {
    TEST_DATA_PATH,
    FILE_ENCODING,
    TOP_MOST_VISITED_URLS = 3,
    TOP_MOST_ACTIVE_IP = 3
} = process.env

const STANDARD_FILE_LOG_REGEX = /^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+)\s?(\S+)?\s?(\S+)?" (\d{3}|-) (\d+|-)\s?"?([^"]*)"?\s?"?([^"]*)?"?/m

const getResultSetter = eventStore => {
    return regexResult => {
        if (!regexResult) {
            console.warn(`No Regex result found, value: ${regexResult}.`)
            return
        }

        const [
            raw,
            ip,
            clientIdentity,
            userName,
            timeStamp,
            httpMethod,
            route,
            httpType,
            statusCode,
            requestByteSize,
            referer,
            userAgent
        ] = regexResult

        const record = {
            raw,
            ip,
            clientIdentity,
            userName,
            timeStamp,
            httpMethod,
            route,
            httpType,
            statusCode,
            requestByteSize,
            referer,
            userAgent
        }

        if (eventStore.has(ip)) {
            const foundEvent = eventStore.get(ip)
            eventStore.set(ip, [...foundEvent, record])
        } else {
            eventStore.set(ip, [record])
        }
    }
}

async function* parseLines(lineIterable) {
    for await (const line of lineIterable) {
        const result = line.match(STANDARD_FILE_LOG_REGEX)
        if (!result) {
            console.warn(`Failed parse, with value: ${line}, returns value ${result}`)
        }
        yield result
    }
}


async function readableToString(readable) {
    let result = ""
    for await (const chunk of readable) {
        result += chunk
    }
    return result
}

async function* chunksToLines(chunkIterable) {
    let previous = ""
    for await (const chunk of chunkIterable) {
        previous += chunk
        while (true) {
            const eolIndex = previous.indexOf("\n")
            if (eolIndex < 0) {
                break
            }

            const line = previous.slice(0, eolIndex + 1)
            yield line
            previous = previous.slice(eolIndex + 1)
        }
    }
    if (previous.length > 0) {
        yield previous
    }
}

async function updateStore(lineIterable, storeSetter) {
    for await (const result of lineIterable) {
        storeSetter(result)
    }
}

async function activeIPAddressAnalyser(store, topX) {
    const count = []
    for await (let [key, value] of store) {
        count.push({ key, value: value.length })
    }

    const messageOutput = {}
    count.sort((a, b) => a.value < b.value ? 1 : -1)
        .splice(0, topX)
        .forEach(({ key, value }, index) => {
            messageOutput[++index] = { IP: key, Count: value }
        })

    console.info(`\nTop '${topX}' most active IP addresses:`)
    console.table(messageOutput)
}

async function mostVisitedURLs(store, topX) {
    const parsedUrls = []
    for await (let value of store.values()) {
        parsedUrls.push(...value.flatMap(x => x.route))
    }

    const results = []
    new Set(parsedUrls).forEach(url => {
        results.push({ key: url, value: parsedUrls.filter(x => x === url).length })
    })

    const messageOutput = {}
    results.sort((a, b) => a.value < b.value ? 1 : -1)
        .splice(0, topX)
        .forEach(({ key, value }, index) => {
            messageOutput[++index] = { URL: key, Count: value }
        })
    console.info(`\nTop '${topX}' most visited URLs:`)
    console.table(messageOutput)
}

function countOfUniqueIPAddress(store) {
    console.info(`\nNumber of unique IP addresses: ${store.size}`)
}

(async () => {
    const parsedLogsStore = new Map()
    const startMessage = `\nParsing file `
    console.log(`${startMessage}${'-'.repeat(process.stdout.columns - startMessage.length)}`)
    console.log(`Log file: "${TEST_DATA_PATH}", with encoding type: "${FILE_ENCODING}"`)

    const readableStream = fs.createReadStream(TEST_DATA_PATH, { encoding: FILE_ENCODING })
    const result = await readableToString(readableStream)

    const reader = Readable.from(result, { encoding: FILE_ENCODING })
    const storeSetter = getResultSetter(parsedLogsStore)
    await updateStore(parseLines(chunksToLines(reader)), storeSetter)

    const resultMessage = '\nResults from parsing log file '
    console.log(`${resultMessage}${'-'.repeat(process.stdout.columns - resultMessage.length)}`)

    countOfUniqueIPAddress(parsedLogsStore)
    activeIPAddressAnalyser(parsedLogsStore, TOP_MOST_VISITED_URLS)
    mostVisitedURLs(parsedLogsStore, TOP_MOST_ACTIVE_IP)
})()
