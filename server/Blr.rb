#encoding: utf-8

require 'json'
require_relative 'Ir'

class Blr < Ir
	def initialize(pid, dev_id)
		super

		@mac = []
	end

	attr_reader :mac
	
	def point_type
		'Ir'
	end

	def attribute
		super.merge({'mac'=>@mac,'command'=>@command})
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'mac'
				@mac = val
			end
		end
	end
end
