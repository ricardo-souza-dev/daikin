#utf-8

class GroupId
	def initialize
		@gid = nil

		begin
			File.open('gid.json') {|f| @gid = f.gets.strip}
		rescue
			puts "No groupd ID. System cannot start"
			exit
		end
	end

	attr_reader :gid
end

