#coding: utf-8

require 'rmodbus'
require 'serialport'
require_relative 'NetPro'
require_relative 'FcuSpliton'

class Spliton < NetPro
	def key
		'spt'
	end

	def make_point(addr)
		point_list = {}
		flag = ''
		attr = @slaves[addr].input_registers[attr_addr]		 
		point = FcuSpliton.new(addr,@dev_id)
		point.set_dev_attr(attr)
		point_list[point.id] = point
		@point_stat[addr] = [[],[],flag,0]

		point_list
	end
end
