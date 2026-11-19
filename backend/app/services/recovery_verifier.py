import asyncio
import time
import httpx
import logging

logger = logging.getLogger("resiliops.verifier")


class RecoveryVerifier:
    """
    Independently probes the application health endpoint post-recovery
    to verify that the service has returned to a genuinely healthy state.
    """

    @staticmethod
    async def verify_application_health(
        url: str,
        max_wait_seconds: float = 12.0,
        probe_interval: float = 1.5,
    ) -> dict:
        """
        Polls the application's URL until it returns HTTP 200..299 or timeout expires.
        """
        start_time = time.time()
        attempts = 0
        last_error = None
        last_status_code = None

        logger.info(f"Beginning post-recovery health verification for: {url}")

        async with httpx.AsyncClient() as client:
            while (time.time() - start_time) < max_wait_seconds:
                attempts += 1
                try:
                    t0 = time.perf_counter()
                    response = await client.get(url, timeout=2.5)
                    latency_ms = int((time.perf_counter() - t0) * 1000)
                    last_status_code = response.status_code

                    if 200 <= response.status_code < 300:
                        elapsed = round(time.time() - start_time, 2)
                        logger.info(f"Verification SUCCEEDED for {url} after {attempts} attempts ({elapsed}s)")
                        return {
                            "is_healthy": True,
                            "status_code": response.status_code,
                            "latency_ms": latency_ms,
                            "attempts": attempts,
                            "elapsed_seconds": elapsed,
                            "message": f"Application verified healthy (HTTP {response.status_code}, {latency_ms}ms)",
                        }
                    else:
                        last_error = f"HTTP {response.status_code}: {response.reason_phrase}"
                except httpx.ConnectError:
                    last_error = "Connection refused (container warming up)"
                except httpx.TimeoutException:
                    last_error = "Request timed out"
                except Exception as ex:
                    last_error = str(ex)[:100]

                await asyncio.sleep(probe_interval)

        elapsed = round(time.time() - start_time, 2)
        logger.warning(f"Verification FAILED for {url} after {attempts} attempts ({elapsed}s). Last error: {last_error}")
        return {
            "is_healthy": False,
            "status_code": last_status_code,
            "latency_ms": 0,
            "attempts": attempts,
            "elapsed_seconds": elapsed,
            "message": f"Health verification failed: {last_error}",
        }

