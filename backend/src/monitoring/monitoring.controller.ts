import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('info')
  @ApiOperation({ summary: 'System information endpoint' })
  @ApiResponse({ status: 200, description: 'System info retrieved successfully' })
  getSystemInfo() {
    return this.monitoringService.getSystemInfo();
  }
}
