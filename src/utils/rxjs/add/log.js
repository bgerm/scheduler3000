import { Observable } from 'rxjs';

Observable.prototype.log = function(prefix) {
  return !__DEBUG__
    ? this
    : this.do({
      next: (x) => console.log(prefix, x),
      complete: (x) => console.log(prefix, 'complete')
    });
};
