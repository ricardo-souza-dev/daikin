class Timer
	def initialize
		@duration = 0
		@countdown = 0
		@th = nil
	end

	def one_time(duration)
		return if(@th != nil)
		@duration = duration
		@th = Thread.new do
			wait_core
			@th = nil
			yield
		end
	end

	def periodic(duration)
		return if(@th != nil)
		@duration = duration
		@th = Thread.new do
			loop {
				wait_core
				yield
			}
		end
	end

	def reset
		@countdown = @duration
	end

	def cancel
		@th.kill if(@th != nil)
		@th = nil
	end

	def wait_core
		@countdown = @duration
		loop {
			sleep(1)
			@countdown -= 1		
			break if(@countdown <= 0)
		}
	end
end

#timer = PingTimer.new
#w = PingTimer.new
#timer.periodic(5) do
#	puts "Exec Timer"
#	w.one_time(3) do
#		puts "One Time TImer"
#	end
#end
#sleep 10
#timer.reset
#sleep 50