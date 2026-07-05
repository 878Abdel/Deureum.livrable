import {
  Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Request,
} from '@nestjs/common';
import { ObjectifsService } from './objectifs.service';
import { CreateObjectifDto } from './dto/create-objectif.dto';
import { UpdateObjectifDto } from './dto/update-objectif.dto';
import { ContribuerDto } from './dto/contribuer.dto';

@Controller('objectifs')
export class ObjectifsController {
  constructor(private readonly objectifsService: ObjectifsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateObjectifDto) {
    return this.objectifsService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.objectifsService.findAllByUser(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.objectifsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateObjectifDto,
  ) {
    return this.objectifsService.update(id, req.user.id, dto);
  }

  @Patch(':id/contribuer')
  contribuer(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ContribuerDto,
  ) {
    return this.objectifsService.contribuer(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.objectifsService.remove(id, req.user.id);
  }
}