import Rx from 'rx';

Rx.Observable.prototype.takeWhileInclusive = function (predicate, thisArg) {
  const source = this;
  const callback = Rx.internals.bindCallback(predicate, thisArg, 3);

  return new Rx.AnonymousObservable(function (o) {
    let i = 0;
    let running = true;

    return source.subscribe(function (x) {
      if (running) {
        try {
          running = callback(x, i++, source);
        } catch (e) {
          o.onError(e);
          return;
        }
        if (running) {
          o.onNext(x);
        } else {
          o.onNext(x);
          o.onCompleted();
        }
      }
    }, function (e) { o.onError(e); }, function () { o.onCompleted(); });
  }, source);
};
