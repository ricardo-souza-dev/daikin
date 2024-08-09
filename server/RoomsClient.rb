# coding: utf-8
#
# This object is a device object of multi site monitoring server

require_relative 'RoomClient'

class RoomsClient < RoomClient
	def initialize(id, data_man)
		super
	end

	def command_dispatch(command,result,data)
#		puts "#{command} #{result} #{data}"
		case(command)
		when 'login'
			if(result == 'OK')
				send(['get_point_list'])
			else
				# login failed
			end
		when 'get_point_list'
			if(result == 'OK')
				point_list = {}
				id_list = []
				data.each do |point|
#					next if(point['type'] != 'Fcu')
					if((pnt = make_point(point)) != nil)
						point_list[point['id']] = pnt 
						id_list.push(point['id'])
					end
				end
				# add to point list of this system
				@data_man.update_point_list(point_list)
				# request point status
				send(['get_point_status',id_list])
			else
				# could not get point list
			end
		when 'get_point_status'
			if(result == 'OK')
				data.each do |stat|
					@data_man.cos_internal(stat[0],stat[1])	# stat[0] is id, stat[1] is cos
				end
			end
		when 'cos'
			@data_man.cos_internal(data[0],data[1])
		end
	end

	def make_point(point_info)
		point = nil
		case point_info['type']
		when 'Fcu'
			point = FcuSvm.new(point_info['pid'],point_info['dev_id'])
		when 'Di'
			point = DiSvm.new(point_info['pid'],point_info['dev_id'])
		end
		if(point != nil) 
			point.name = point_info['name']
			point.icon = point_info['icon']
			point.svm_dev = @dev_id
			point.sub_type = point_info['subtype']
			point.usage = point_info['usage']
			point.set_attr(point_info['attr'])
		end
		return point
	end
end