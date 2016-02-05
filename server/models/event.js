import mongoose from 'mongoose';
import timestamps from 'mongoose-timestamp';
import moment from 'moment-timezone';
const Schema = mongoose.Schema;

var eventSchema = new Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  allDay: { type: Boolean, required: true }
});

// converts from date to timezone in same date
// TODO more efficient
const sameDay = (utc, timezone) => {
  const { years, months, date } = moment.utc(utc).toObject();
  return moment.tz([years, months, date], timezone);
  
}

eventSchema.plugin(timestamps);
eventSchema.options.toJSON = {
  transform: function(doc, ret, options) {
    if (options.timezone && ret.allDay) {
      ret.startDate = sameDay(ret.startDate, options.timezone).toDate();
      ret.endDate = sameDay(ret.endDate, options.timezone).endOf('day').toDate();
    }
    ret.startDate = ret.startDate.valueOf();
    ret.endDate = ret.endDate.valueOf();
    
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
};

export default mongoose.model('Event', eventSchema);
