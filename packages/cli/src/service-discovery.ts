import fs from "fs";
import path from "path";
import os from "os";
import { spawnSync } from "child_process";
import inquirer from "inquirer";
import { ApiClient } from "@notes-sync/shared";

interface ServiceInfo {
  host: string;
  port: number;
  isRunning: boolean;
  isInstalled: boolean;
}

export class ServiceDiscovery {
  private readonly defaultHost = "127.0.0.1";
  private readonly defaultPort = 3127;
  private readonly configPath = path.join(
    os.homedir(),
    ".config",
    "notes-sync",
    "config.json",
  );

  async discoverService(): Promise<ServiceInfo> {
    // Step 1: Try to read service config
    const configInfo = this.readServiceConfig();

    // Step 2: Try to connect to service
    const isRunning = await this.checkServiceRunning(
      configInfo.host,
      configInfo.port,
    );

    if (isRunning) {
      return {
        host: configInfo.host,
        port: configInfo.port,
        isRunning: true,
        isInstalled: true,
      };
    }

    // Step 3: Check if service is installed globally
    const isInstalled = this.checkServiceInstalled();

    return {
      host: configInfo.host,
      port: configInfo.port,
      isRunning: false,
      isInstalled,
    };
  }

  private readServiceConfig(): { host: string; port: number } {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        return {
          host: config.server?.host || this.defaultHost,
          port: config.server?.port || this.defaultPort,
        };
      }
    } catch (error) {
      console.warn("Could not read service config:", error);
    }

    return {
      host: this.defaultHost,
      port: this.defaultPort,
    };
  }

  private async checkServiceRunning(
    host: string,
    port: number,
  ): Promise<boolean> {
    try {
      const client = new ApiClient(`http://${host}:${port}`);
      const status = await client.getStatus();
      return status.running;
    } catch (error) {
      return false;
    }
  }

  private checkServiceInstalled(): boolean {
    // First check if we're in development mode (workspace)
    const isDevelopment = this.isDevelopmentMode();

    if (isDevelopment) {
      console.log(
        "🔧 Development mode detected - assuming local service is available on port " +
          this.defaultPort,
      );
      // In development, assume service is available locally
      return true;
    }

    // Check if @notes-sync/service is installed globally
    const result = spawnSync("npm", ["list", "-g", "@notes-sync/service"], {
      stdio: "pipe",
      encoding: "utf8",
    });

    return result.status === 0;
  }

  private isDevelopmentMode(): boolean {
    // Check if we're running in a yarn workspace
    try {
      const cwd = process.cwd();

      // Check if we're in the monorepo root
      const rootPackageJson = path.join(cwd, "package.json");
      if (fs.existsSync(rootPackageJson)) {
        const packageJson = JSON.parse(
          fs.readFileSync(rootPackageJson, "utf8"),
        );
        if (
          packageJson.workspaces &&
          packageJson.workspaces.includes("packages/*")
        ) {
          return true;
        }
      }

      // Check if we're in a packages directory
      const parentDir = path.dirname(cwd);
      const parentPackageJson = path.join(parentDir, "package.json");
      if (fs.existsSync(parentPackageJson)) {
        const parentJson = JSON.parse(
          fs.readFileSync(parentPackageJson, "utf8"),
        );
        if (
          parentJson.workspaces &&
          parentJson.workspaces.includes("packages/*")
        ) {
          return true;
        }
      }

      // Check if we're in packages/cli or packages/service
      const grandParentDir = path.dirname(parentDir);
      const grandParentPackageJson = path.join(grandParentDir, "package.json");
      if (fs.existsSync(grandParentPackageJson)) {
        const grandParentJson = JSON.parse(
          fs.readFileSync(grandParentPackageJson, "utf8"),
        );
        if (
          grandParentJson.workspaces &&
          grandParentJson.workspaces.includes("packages/*")
        ) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.warn("Error detecting development mode:", error);
      return false;
    }
  }

  async ensureService(promptForInstall: boolean = true): Promise<ApiClient> {
    let attempts = 0;
    const maxAttempts = promptForInstall ? 3 : 1;

    while (attempts < maxAttempts) {
      const serviceInfo = await this.discoverService();

      if (serviceInfo.isRunning) {
        return new ApiClient(`http://${serviceInfo.host}:${serviceInfo.port}`);
      }

      if (promptForInstall) {
        if (serviceInfo.isInstalled) {
          // Service is installed but not running
          await this.promptStartService(serviceInfo);
        } else {
          // Service is not installed
          await this.promptInstallService();
        }
      } else {
        throw new Error("Service is not running and auto-installation is disabled");
      }

      attempts++;

      if (attempts < maxAttempts) {
        console.log(
          `\nRetrying connection (attempt ${attempts + 1}/${maxAttempts})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    const isDevelopment = this.isDevelopmentMode();

    if (isDevelopment) {
      throw new Error(
        "Failed to connect to notes-sync service after multiple attempts.\n" +
          "Development mode detected. Please check:\n" +
          "1. Is the service running? Try: yarn dev:service\n" +
          "2. Is the service running on the correct port? Check config\n" +
          "3. Are you running from the workspace root?\n" +
          "4. Try: cd packages/service && yarn dev",
      );
    } else {
      throw new Error(
        "Failed to connect to notes-sync service after multiple attempts.\n" +
          "Please check:\n" +
          "1. Is the service installed? Run: npm install -g @notes-sync/service\n" +
          "2. Is the service running? Check the service status\n" +
          "3. Is the host/port correct? Check your config file",
      );
    }
  }

  private async promptStartService(serviceInfo: ServiceInfo): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message:
          "Service is installed but not running. What would you like to do?",
        choices: [
          { name: "Start the service", value: "start" },
          { name: "Enter custom host/port", value: "custom" },
          { name: "Exit", value: "exit" },
        ],
      },
    ]);

    if (action === "exit") {
      process.exit(0);
    }

    if (action === "start") {
      const isDevelopment = this.isDevelopmentMode();

      if (isDevelopment) {
        console.log("\nTo start the service in development mode:");
        console.log("1. yarn dev:service");
        console.log("2. cd packages/service && yarn dev");
        console.log("3. Or start it manually and try again");
      } else {
        console.log("\nTo start the service, run one of these commands:");
        console.log("1. notes-sync-service start");
        console.log("2. npm start -g @notes-sync/service");
        console.log("3. Or start it manually and try again");
      }
    }

    if (action === "custom") {
      const { host, port } = await inquirer.prompt([
        {
          type: "input",
          name: "host",
          message: "Enter service host:",
          default: serviceInfo.host,
        },
        {
          type: "number",
          name: "port",
          message: "Enter service port:",
          default: serviceInfo.port,
        },
      ]);

      serviceInfo.host = host;
      serviceInfo.port = port;
    }
  }

  private async promptInstallService(): Promise<void> {
    const isDevelopment = this.isDevelopmentMode();

    if (isDevelopment) {
      console.log(
        "\nIn development mode, the service should be available locally.",
      );
      console.log("Make sure you're running from the workspace root and try:");
      console.log("1. yarn dev:service");
      console.log("2. Or cd packages/service && yarn dev");
      return;
    }

    console.log("📦 Service not installed. Installing it now...");

    try {
      const { spawnSync } = require("child_process");
      const installResult = spawnSync(
        "npm",
        ["install", "-g", "@notes-sync/service"],
        {
          stdio: "inherit",
        },
      );

      if (installResult.status !== 0) {
        console.error("❌ Failed to install service automatically");
        console.log(
          "💡 Try running manually: npm install -g @notes-sync/service",
        );
        return;
      }

      console.log("✅ Service installed successfully!");

      // Try to run the service install script
      const serviceInstallResult = spawnSync(
        "notes-sync-service",
        ["install"],
        {
          stdio: "inherit",
        },
      );

      if (serviceInstallResult.status === 0) {
        console.log("✅ Service configured successfully!");
      } else {
        console.log(
          "⚠️  Service installed but not configured. Run 'notes-sync-service install' manually.",
        );
      }
    } catch (error) {
      console.error("❌ Failed to install service:", error);
    }
  }
}
