#coding: utf-8

require_relative 'Vam'

class VamSvm < Vam
	def initialize(pid,dev_id)
		super
	end

	def attribute
		super.merge({'svm_dev'=>@svm_dev})
	end

	def set_attr(attr)
		super
		attr.each do |key, val|
			case key
			when 'svm_dev'
				@svm_dev = val
			end
		end			
	end
end
