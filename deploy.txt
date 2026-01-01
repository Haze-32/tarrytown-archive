function deploy {
  git add .
  git commit -m "deploy"
  git push origin main
  git push live main
  ssh battley4@battlestationbuilds.com "/home1/battley4/repositories/tarrytown-archive/deploy.sh"
}
