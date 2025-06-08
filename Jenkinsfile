pipeline {
agent any
stages {
stage('Clone') {
steps {
echo 'Cloning repository...'
}
}
stage('Build') {
steps {
sh './run.sh'
}
}
}
}
