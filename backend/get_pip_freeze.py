import subprocess
import sys

result = subprocess.run([sys.executable, '-m', 'pip', 'freeze'], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print(result.stderr, file=sys.stderr)
