const argparse = require('argparse');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const { performance } = require('perf_hooks');

function main() {
  try {
    const parser = new argparse.ArgumentParser({ description: "Check website status" });
    parser.add_argument("host", { help: "The host to check" });
    parser.add_argument("-ssl", { action: "store_true", help: "Use SSL (https) protocol" });
    const args = parser.parse_args();

    let host = args.host.toLowerCase().trim();
    if (args.ssl) {
      if (!host.startsWith("https://")) {
        host = "https://" + host;
      }
    } else {
      if (!host.startsWith("http://")) {
        host = "http://" + host;
      }
    }

    const url = new URL(host);
    const protocol = url.protocol;
    const port = url.port ? url.port : protocol === 'http:' ? 80 : 443;
    const options = {
      method: 'GET',
      hostname: url.hostname,
      port: port,
      path: '/?turboping'
    };

    const success = [200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303, 304, 305, 307, 308];

    console.log(`Checking status for ${url.href} (${protocol})...`);

    setInterval(() => {
      const start_time = performance.now();
      const req = protocol === 'http:' ? http : https;
      const req_options = Object.assign({}, options, {
        agent: new req.Agent({ keepAlive: true }),
      });
      const request = req.request(req_options, (response) => {
        const end_time = performance.now();
        const elapsed_time = (end_time - start_time) / 1000;
        if (success.includes(response.statusCode)) {
          console.log(`${url.href} is up, response time: ${elapsed_time.toFixed(2)} seconds`);
        } else {
          console.log(`${url.href} is down, status code: ${response.statusCode}`);
        }
      });

      request.on('error', (e) => {
        console.log(`${url.href} is down, error: ${e}`);
      });

      request.end();
    }, 500);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
