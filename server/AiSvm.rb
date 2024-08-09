#coding: utf-8

require_relative 'Ai'

class AiSvm < Ai
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

class AoSvm < Ao
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

class LevelSwSvm < LevelSwitch
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

	def update_av(val,cos,time)
		update_level(val,cos,time,false)
	end
end

class RgbLevelSvm < RgbLevel
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

	def update_av(val,cos,time)
		update_level(val,cos,time,false)
	end

	def update_r(val,cos,zwflag = false)
		super
	end

	def update_g(val,cos,zwflag = false)
		super
	end

	def update_b(val,cos,zwflag = false)
		super
	end

	def update_w(val,cos,zwflag = false)
		super
	end
end


