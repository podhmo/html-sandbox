// Tiny logging reverse proxy: 127.0.0.1:8787 -> https://api.sarashina.ai
// Logs request line, response status/headers (retry-after!), and each SSE
// line with a timestamp delta so stalls in the stream are visible.
import http from "node:http";
import https from "node:https";

const UPSTREAM = process.env.UPSTREAM_HOST ?? "api.sarashina.ai";
const PORT = Number(process.env.TRACE_PORT ?? 8787);
const log = (...a) => console.log(new Date().toISOString(), ...a);

http.createServer((req, res) => {
	const t0 = Date.now();
	const chunks = [];
	// Propagate downstream disconnects upstream: if the client (pi) aborts or
	// its socket dies, tear down the in-flight upstream request/response
	// instead of leaving generation running and sockets leaking.
	let u = null;
	let ur = null;
	res.on("close", () => {
		u?.destroy();
		ur?.destroy();
	});
	req.on("data", (c) => chunks.push(c));
	req.on("end", () => {
		const body = Buffer.concat(chunks);
		log(`--> ${req.method} ${req.url} body=${body.length}B`);
		u = https.request(
			{ host: UPSTREAM, path: req.url, method: req.method,
			  headers: { ...req.headers, host: UPSTREAM } },
			(upstreamRes) => {
				ur = upstreamRes;
				log(`<-- ${ur.statusCode} ${req.url} retry-after=${ur.headers["retry-after"] ?? "-"} +${Date.now() - t0}ms`);
				res.writeHead(ur.statusCode, ur.headers);
				let sse = "";
				ur.on("data", (c) => {
					res.write(c);
					sse += c.toString("utf8");
					let i;
					while ((i = sse.indexOf("\n")) >= 0) {
						const line = sse.slice(0, i).trimEnd();
						sse = sse.slice(i + 1);
						if (line) log(`    +${String(Date.now() - t0).padStart(6)}ms ${line.slice(0, 160)}`);
					}
				});
				ur.on("end", () => { res.end(); log(`    EOF ${req.url} +${Date.now() - t0}ms`); });
				ur.on("error", (e) => { log(`    ERR(up-res) ${req.url} ${e.message}`); res.destroy(e); });
			},
		);
		u.on("error", (e) => {
			log(`    ERR ${req.url} ${e.message}`);
			if (!res.headersSent) { res.writeHead(502).end(); } else { res.destroy(e); }
		});
		u.write(body);
		u.end();
	});
}).listen(PORT, "127.0.0.1", () => log(`listening on http://127.0.0.1:${PORT}`));
