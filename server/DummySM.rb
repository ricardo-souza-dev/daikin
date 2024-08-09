require_relative 'Device'

# Device list format
# ["DummySmartMeter",1,{"meters":{"1":"SmartPi","2":"SmartPi"}}]
#
#  meters can add/delete in this setting
#
class DummySmartMeter < Device
	def initialize(id, data_man)
		super
		@meters = {}	# {type=>addr,...}
		@last_data = {}

		@poling_wait = 10 
	end

	def key
		'dmb'
	end

	def device_attr
		{'meters'=>@meters}
	end

	def set_attribute(attr)
		@meters = attr['meters'] if(attr['meters'] != nil)
	end

	def changed?(attr)
		return true if(@meters != attr['meter'])
		return false
	end
	
	def connect
		@thread = Thread.new do
			loop {
				puts "Start Dummy Smart Meter"
				connect_slave
				sleep 5
			}
		end
	end

	def connect_slave
		point_list = {}
		new_points = {}
		@meters.each do |addr,type|
			addr = addr.to_i
			pid = ManagementPoint.get_id(addr,@dev_id)
			# if management point is not exist add management point with pid
			if(@data_man.point_list[pid] == nil)
				new_points[pid] = make_new_point(addr,type) 
				point_list[pid] = new_points[pid] 
				@last_data[pid] = {'com_stat'=>true,'meter'=>0,'power'=>rand(1..10)}
			else
				point_list[pid] = @data_man.point_list[pid]
				meter = point_list[pid].meter
				meter = 0 if(meter == nil)
				@last_data[pid] = {'com_stat'=>true,'meter'=>meter,'power'=>rand(1..10)}
			end
		end
		@data_man.update_point_list(new_points)
		make_dummy_data(point_list)

		loop do
			point_list.each do |pid,point|
					# set new value to the management point
				data = @last_data[pid]
				@data_man.cos(point.pid,@dev_id,data)
			end
			sleep @poling_wait
			increment_dummy_data
		end
	end

	def dev_disconnected(dev)
		@data_man.add_history('System',[dev,@addr])
		@data_man.cos(id,@dev_id,{'com_stat'=>false})
	end

	def make_new_point(addr,type)
		point = Module.const_get(type).new(addr,@dev_id)
	end

	def make_dummy_data(point_list)
		point_list.each do |pid,point|
			next if(point.children == nil)
			point.children.each_key do |id|
				@last_data[pid]['meter'] += @data_man.point_list[id].meter if(@data_man.point_list[id].meter != nil)
			end
		end
	end

	def increment_dummy_data
		@last_data.each do |pid, data|
			add_val = rand(0..1)
			if(add_val == 1)
				data['meter'] += add_val
				parent = @data_man.point_list[pid].parent
				@last_data[parent]['meter'] += add_val if(parent != nil)
			end
		end
	end
end
