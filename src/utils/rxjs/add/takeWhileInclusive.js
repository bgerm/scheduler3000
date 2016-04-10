import { Observable } from 'rxjs';

Observable.prototype.takeWhileInclusive = function(predicate) {
  const source = this;

  return Observable.create(function(o) {
    return source.subscribe(function(val) {
      o.next(val);

      if (!predicate(val)) {
        o.complete();
      }
    }, o.error.bind(o), o.complete.bind(o));
  });
};
