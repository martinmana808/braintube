const videoId = process.argv[2] || '2B-OancSM80';

async function test() {
  console.log(`Testing discovery and srv3 for videoId: ${videoId}`);
  try {
    const listUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&type=list`;
    const listRes = await fetch(listUrl);
    const listXml = await listRes.text();
    console.log('List Status:', listRes.status);
    console.log('List XML:', listXml);

    const srv3Url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`;
    console.log(`Fetching SRV3: ${srv3Url}`);
    const srv3Res = await fetch(srv3Url);
    const srv3Text = await srv3Res.text();
    console.log('SRV3 Status:', srv3Res.status);
    console.log('SRV3 Length:', srv3Text.length);
    console.log('SRV3 Start:', srv3Text.substring(0, 200));

} catch (error) {
    console.error('FAILED:', error.message);
}
}

test();
