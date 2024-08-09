#encoding: utf-8

require 'json'
require_relative 'ManagementPoint'

class Ir < ManagementPoint
	def initialize(pid, dev_id)
		super
		@icon = 'IR.png'

		@model = nil
		@command = nil	# read from IrCommand.json
	end

	attr_reader :model
	
	def point_type
		'Ir'
	end

	def attribute
		super.merge({'model'=>@model,'command'=>@command})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'model'
				@model = val
			when 'command'
				@command = val
			end
		end
	end

	def check_ircommand(val,com,stat)
		com[val] = 'on'
	end
end
