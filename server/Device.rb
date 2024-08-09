#coding: utf-8

require 'thread'

class Device
	def initialize(id,data_man)		# id is integer
		raise ArgumentError,'id has to be positive intenger' if(id == nil or id.is_a?(Integer) == false or id < 0)
		@id= id
		@dev_id = key+sprintf("%03d",@id)
		@data_man = data_man
		@poling_wait = 2
		@thread = nil

		@com_queue = Queue.new
		@resend_queue = Queue.new

		@ready = false
		@connected = false
		
		@point_list = {}
	end

	attr_reader :id, :dev_id, :com_queue
	attr_accessor :ready

	def class_type
		self.class.to_s
	end

	def device_info
		[class_type,@id,device_attr]
	end

	# command is hash
	def operate(pid,command)
		@com_queue << [pid,command] #if(@ready == true)
		return @ready
	end

	# below methods should overwrite in sub class
	def key
		'd'
	end
	
	def device_attr
		{}
	end

	def set_attribute(attr)
	end

	def req_ppd_data(time)
		true
	end
	
	def changed?(attr)
	end

	def connect
		Thread.new do
#			loop {
				# initialize
				# get point list
				# get point attribute
				# register points
#				loop {
					# update status
					# send command
#				}
#			}
		end
	end

	def reconnect
		Thread.kill(@thread) if(@thread != nil)
		@thread = nil
		connect
	end

	def kill
		Thread.kill(@thread) if(@thread != nil)
		@thread = nil
	end

	def init_ppd_database
	end
end
