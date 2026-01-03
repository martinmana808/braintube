const apiKey = 'AIzaSyCObw-0gkx6ZI_TSF2U0NbrlAxqNnY1J1Y';
const playlistId = 'UUPGrgwfbkjTIgPoOh2q1BAg';

async function test() {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=10&key=${apiKey}`;
  console.log(`Testing URL: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
