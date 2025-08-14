class WakeDetectorClass {
  private onWakeCallbacks: (() => void)[] = [];
  private interval: NodeJS.Timeout | null = null;
  private previousTime = Date.now();

  start(wakeInterval: number = 20000) {
    if (this.interval) return; // already running
    this.interval = setInterval(() => {
      const now = Date.now();
      const diff = now - this.previousTime;
      if (diff > wakeInterval) {
        console.log("wake");
        for (const cb of this.onWakeCallbacks) {
          try {
            cb();
          } catch {}
        }
      }
      this.previousTime = now;
    }, 10000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  onWake(callback: () => void) {
    this.onWakeCallbacks.push(callback);
    return { stopListening: () => this.offWake(callback) };
  }

  offWake(callback: () => void) {
    this.onWakeCallbacks = this.onWakeCallbacks.filter((cb) => cb !== callback);
  }

  isRunning() {
    return this.interval !== null;
  }
}

export const WakeDetector = new WakeDetectorClass();
