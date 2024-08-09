#coding: utf-8

require_relative 'Dio'
require_relative 'DioZw'

class DiSvm < Di
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

class DioSvm < Dio
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

class KeyLockSvm < KeyLockZw
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

class ShutterSvm < ShutterZw
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
