import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  events: string[];
  commands: string[];
}

export interface PluginEvent {
  type: string;
  data: any;
  channelId?: string;
  userId?: string;
}

@Injectable()
export class PluginManager implements OnModuleInit {
  private plugins: Map<string, Plugin> = new Map();
  private pluginDir = path.join(process.cwd(), 'plugins');

  constructor(private eventEmitter: EventEmitter2) {}

  async onModuleInit() {
    await this.loadPlugins();
  }

  private async loadPlugins() {
    try {
      if (!fs.existsSync(this.pluginDir)) {
        fs.mkdirSync(this.pluginDir, { recursive: true });
      }

      const pluginFiles = fs.readdirSync(this.pluginDir)
        .filter(file => file.endsWith('.js') || file.endsWith('.json'));

      for (const file of pluginFiles) {
        await this.loadPlugin(file);
      }

      console.log(`Loaded ${this.plugins.size} plugins`);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    }
  }

  private async loadPlugin(filename: string) {
    try {
      const pluginPath = path.join(this.pluginDir, filename);
      const pluginModule = require(pluginPath);
      
      if (pluginModule.default && typeof pluginModule.default === 'object') {
        const plugin: Plugin = {
          name: pluginModule.default.name,
          version: pluginModule.default.version,
          description: pluginModule.default.description,
          author: pluginModule.default.author,
          enabled: pluginModule.default.enabled !== false,
          events: pluginModule.default.events || [],
          commands: pluginModule.default.commands || [],
        };

        this.plugins.set(plugin.name, plugin);

        // Register plugin event handlers
        if (plugin.enabled && plugin.events.length > 0) {
          this.registerPluginEvents(plugin, pluginModule.default);
        }

        console.log(`Loaded plugin: ${plugin.name} v${plugin.version}`);
      }
    } catch (error) {
      console.error(`Failed to load plugin ${filename}:`, error);
    }
  }

  private registerPluginEvents(plugin: Plugin, pluginModule: any) {
    for (const eventType of plugin.events) {
      this.eventEmitter.on(eventType, (data: any) => {
        if (pluginModule.handleEvent) {
          try {
            pluginModule.handleEvent(eventType, data);
          } catch (error) {
            console.error(`Plugin ${plugin.name} error handling event ${eventType}:`, error);
          }
        }
      });
    }
  }

  async enablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    plugin.enabled = true;
    // Reload plugin to register events
    await this.loadPlugin(`${name}.js`);
    return true;
  }

  async disablePlugin(name: string): Promise<boolean> {
    const plugin = this.plugins.get(name);
    if (!plugin) return false;

    plugin.enabled = false;
    // Remove event listeners
    this.eventEmitter.removeAllListeners();
    // Re-register enabled plugins
    for (const [pluginName, pluginData] of this.plugins) {
      if (pluginData.enabled) {
        await this.loadPlugin(`${pluginName}.js`);
      }
    }
    return true;
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  async installPlugin(pluginData: any): Promise<boolean> {
    try {
      const filename = `${pluginData.name}.js`;
      const filepath = path.join(this.pluginDir, filename);
      
      // Create plugin file
      const pluginCode = `
module.exports = {
  name: '${pluginData.name}',
  version: '${pluginData.version}',
  description: '${pluginData.description}',
  author: '${pluginData.author}',
  enabled: true,
  events: ${JSON.stringify(pluginData.events || [])},
  commands: ${JSON.stringify(pluginData.commands || [])},
  
  handleEvent: function(eventType, data) {
    // Plugin event handler
    console.log('Plugin ${pluginData.name} received event:', eventType, data);
  },
  
  handleCommand: function(command, data) {
    // Plugin command handler
    console.log('Plugin ${pluginData.name} received command:', command, data);
  }
};
`;

      fs.writeFileSync(filepath, pluginCode);
      await this.loadPlugin(filename);
      return true;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      return false;
    }
  }

  emitEvent(event: PluginEvent) {
    this.eventEmitter.emit(event.type, event);
  }
}
