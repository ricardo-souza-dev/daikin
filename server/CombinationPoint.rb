# coding: utf-8

class DioCombi < Dio
	def initialize(pid, dev_id)
		super
		@di = nil	# point id
		@dio = nil # point id
		@dio_point = nil
	end

	def init(data_man)
		@dio_point = data_man.point_list[@dio]
	end

	def attribute
		super.merge({'di'=>@di,'dio'=>@dio})
	end

	def current_status
	end

	def get_snapshot
	end

	def set_attr(attr)
		super
		attr.each do |key,val|
			case key
			when 'di'
				@di = val
			when 'dio'
				@dio = val
			end
		end		
	end

	# transfer command to dio point
	def operate(command)
		com = {}
		stat = {}
		return com,stat if(@ready == false || @dio == nil)

		return @dio_point.operate(command)
	end
end

