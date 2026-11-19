import http.server
import json
import os
import sys

PORT = int(os.environ.get("PORT", 8000))
IS_HEALTHY = True


class SampleAppHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global IS_HEALTHY
        if self.path == "/health":
            if IS_HEALTHY:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                payload = json.dumps({
                    "status": "healthy",
                    "app": "resiliops-sample-microservice",
                    "version": "v1.0.0",
                    "container": os.environ.get("HOSTNAME", "docker-container"),
                })
                self.wfile.write(payload.encode("utf-8"))
            else:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"status": "error", "message": "Simulated microservice crash"}')
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message": "ResiliOps Sample Microservice running in Docker"}')

    def do_POST(self):
        global IS_HEALTHY
        if self.path == "/crash":
            IS_HEALTHY = False
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message": "Microservice switched to failing state (HTTP 500)"}')
        elif self.path == "/exit":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message": "Microservice container exiting"}')
            sys.exit(1)
        elif self.path == "/recover":
            IS_HEALTHY = True
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message": "Microservice returned to healthy state"}')
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Clean stdout logging
        sys.stdout.write(f"[sample-microservice] {self.address_string()} - {format % args}\n")
        sys.stdout.flush()


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), SampleAppHandler)
    print(f"ResiliOps Sample Microservice listening on port {PORT}...")
    server.serve_forever()

