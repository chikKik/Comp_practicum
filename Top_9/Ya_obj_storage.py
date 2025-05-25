import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import os

class ObjectStorageManager:
    def __init__(self, endpoint_url=None, aws_access_key_id=None, aws_secret_access_key=None, region_name=None):
        """
        Инициализация работы с object storage.
        
        :param endpoint_url: URL хранилища ('https://storage.yandexcloud.net')
        :param aws_access_key_id: Ключ доступа
        :param aws_secret_access_key: Секретный ключ
        """
        session = boto3.session.Session()
        self.s3 = session.client(
            service_name='s3',
            endpoint_url=endpoint_url,
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key
        )
    
    def list_buckets(self):
        """
        Получить список всех бакетов
        """
        try:
            response = self.s3.list_buckets()
            return [bucket['Name'] for bucket in response['Buckets']]
        except NoCredentialsError:
            print("Credentials not available")
            return []
        except ClientError as e:
            print(f"Error listing buckets: {e}")
            return []
    
    def list_objects(self, bucket_name, prefix=''):
        """
        Получить список объектов
        """
        try:
            response = self.s3.list_objects_v2(Bucket=bucket_name, Prefix=prefix)
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            return []
        except ClientError as e:
            print(f"Error listing objects in bucket {bucket_name}: {e}")
            return []
    
    def upload_file(self, bucket_name, file_path, object_name=None):
        """
        Загрузить файл в бакет
        
        :param bucket_name: Имя бакета
        :param file_path: Путь к файлу на локальной машине
        :param object_name: Имя объекта в хранилище (если None, будет использовано имя файла)
        :return: True если файл был загружен, иначе False
        """
        if object_name is None:
            object_name = os.path.basename(file_path)
        
        try:
            self.s3.upload_file(file_path, bucket_name, object_name)
            print(f"File {file_path} uploaded to {bucket_name}/{object_name}")
            return True
        except FileNotFoundError:
            print(f"The file {file_path} was not found")
            return False
        except NoCredentialsError:
            print("Credentials not available")
            return False
        except ClientError as e:
            print(f"Error uploading file: {e}")
            return False
    
    def download_file(self, bucket_name, object_name, file_path=None):
        """
        Скачать файл из бакета
        
        :param bucket_name: Имя бакета
        :param object_name: Имя объекта в хранилище
        :param file_path: Путь для сохранения файла (если None, будет использовано имя объекта)
        :return: True если файл был скачан, иначе False
        """
        if file_path is None:
            file_path = object_name
        
        try:
            self.s3.download_file(bucket_name, object_name, file_path)
            print(f"File {object_name} downloaded from {bucket_name} to {file_path}")
            return True
        except NoCredentialsError:
            print("Credentials not available")
            return False
        except ClientError as e:
            print(f"Error downloading file: {e}")
            return False
    
    def delete_file(self, bucket_name, object_name):
        """
        Удалить файл из бакета
        
        :param bucket_name: Имя бакета
        :param object_name: Имя объекта в хранилище
        :return: True если файл был удален, иначе False
        """
        try:
            self.s3.delete_object(Bucket=bucket_name, Key=object_name)
            print(f"File {object_name} deleted from {bucket_name}")
            return True
        except NoCredentialsError:
            print("Credentials not available")
            return False
        except ClientError as e:
            print(f"Error deleting file: {e}")
            return False


if __name__ == "__main__":

    storage = ObjectStorageManager(
        endpoint_url='https://storage.yandexcloud.net',
        aws_access_key_id='ключ из скрытого файла',
        aws_secret_access_key='ключ из скрытого файла',
        region_name='ru-central1'
    )
    
    # Список бакетов
    print("Available buckets:", storage.list_buckets())
    
    # Имя тестового бакета (должен существовать)
    test_bucket = 'myobjstorage'
    
    # Загрузка файла
    storage.upload_file(test_bucket, 'test.txt')
    
    # Список файлов в бакете
    print("Files in bucket:", storage.list_objects(test_bucket))
    
    # Скачивание файла
    storage.download_file(test_bucket, 'test.txt', 'downloaded_test.txt')
    
    # Удаление файла
    storage.delete_file(test_bucket, 'test.txt')