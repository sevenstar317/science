pm2 stop app.js -x -- --prod
git stash
git pull
git stash pop
pm2 start app.js -x -- --prod